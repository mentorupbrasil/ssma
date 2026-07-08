#!/usr/bin/env node
/**
 * Vercel build — sincroniza o banco Neon com o schema Prisma.
 *
 * 1. Libera advisory locks stale (builds anteriores interrompidos).
 * 2. Tenta migrate deploy (conexão direta + sem advisory lock no CI).
 * 3. Se P3005 (banco legado): patches SQL + db push.
 * 4. Se migrate falhar por lock: db push como fallback (schema já aplicado via patches).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SCHEMA = "prisma/schema.prisma";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PATCH_ENUMS = path.join(ROOT, "scripts", "production-schema-patch-enums.sql");
const PATCH = path.join(ROOT, "scripts", "production-schema-patch.sql");
const PATCH_PHASE1 = path.join(
  ROOT,
  "prisma",
  "migrations",
  "20260708150000_product_repositioning_phase1",
  "migration.sql",
);
const LOCK_RELEASE = path.join(ROOT, "scripts", "release-prisma-migrate-locks.sql");
const MIGRATE_MAX_ATTEMPTS = 2;
const MIGRATE_RETRY_MS = 5000;

/** Neon pooler não suporta pg_advisory_lock — migrate precisa da URL direta. */
function resolveDirectDatabaseUrl() {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  const pooled = process.env.DATABASE_URL;
  if (!pooled) return null;
  if (pooled.includes("-pooler.")) {
    return pooled.replace("-pooler.", ".");
  }
  return null;
}

function sleep(ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    /* busy wait — script síncrono */
  }
}

function runPrisma(subcommand, args = [], options = {}) {
  const env = {
    ...process.env,
    ...options.extraEnv,
  };
  if (options.useDirect) {
    const direct = resolveDirectDatabaseUrl();
    if (direct) {
      env.DATABASE_URL = direct;
    }
  }

  const fullArgs = ["prisma", subcommand, ...args, "--schema", SCHEMA];
  const result = spawnSync("npx", fullArgs, {
    encoding: "utf8",
    cwd: ROOT,
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
    env,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  return { status: result.status ?? 1, output };
}

function fail(message, output = "") {
  console.error(`✗ ${message}`);
  if (output) process.stderr.write(output);
  process.exit(1);
}

function runSqlPatch(label, filePath) {
  console.log(`→ ${label}`);
  const result = runPrisma("db", ["execute", "--file", filePath]);
  if (result.status !== 0) {
    fail(`${label} falhou`, result.output);
  }
  console.log(`✓ ${label}`);
}

function isAdvisoryLockTimeout(output) {
  return (
    output.includes("P1002") ||
    output.includes("advisory lock") ||
    output.includes("pg_advisory_lock")
  );
}

function releaseStaleMigrateLocks() {
  if (!resolveDirectDatabaseUrl()) return;
  console.log("→ liberando advisory locks stale");
  const result = runPrisma("db", ["execute", "--file", LOCK_RELEASE], { useDirect: true });
  if (result.status !== 0) {
    console.warn("⚠ Não foi possível liberar locks (continuando)");
  }
}

function runDbPush(label = "prisma db push") {
  console.log(`→ ${label}`);
  const push = runPrisma("db", ["push", "--skip-generate", "--accept-data-loss"]);
  if (push.status !== 0) {
    fail("db push falhou", push.output);
  }
  console.log("✓ Schema sincronizado");
}

function runMigrateDeploy() {
  releaseStaleMigrateLocks();

  const direct = resolveDirectDatabaseUrl();
  if (direct) {
    console.log("→ prisma migrate deploy (conexão direta Neon, CI)");
  } else {
    console.log("→ prisma migrate deploy");
  }

  const migrateEnv = { PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1" };

  let last = { status: 1, output: "" };
  for (let attempt = 1; attempt <= MIGRATE_MAX_ATTEMPTS; attempt++) {
    last = runPrisma("migrate", ["deploy"], { useDirect: true, extraEnv: migrateEnv });
    if (last.status === 0) return last;
    if (!isAdvisoryLockTimeout(last.output) || attempt === MIGRATE_MAX_ATTEMPTS) {
      return last;
    }
    console.warn(
      `⚠ Advisory lock ocupado (tentativa ${attempt}/${MIGRATE_MAX_ATTEMPTS}) — aguardando ${MIGRATE_RETRY_MS / 1000}s...`,
    );
    releaseStaleMigrateLocks();
    sleep(MIGRATE_RETRY_MS);
  }
  return last;
}

const migrate = runMigrateDeploy();

if (migrate.status === 0) {
  console.log("✓ Migrations aplicadas");
  process.exit(0);
}

const isLegacyDb =
  migrate.output.includes("P3005") ||
  migrate.output.includes("not empty") ||
  migrate.output.includes("baseline");

if (isLegacyDb) {
  console.warn("");
  console.warn("⚠ Banco legado (sem histórico de migrations) — aplicando patches SQL...");
  console.warn("");

  runSqlPatch("patch enums", PATCH_ENUMS);
  runSqlPatch("patch schema", PATCH);
  runSqlPatch("patch phase 1", PATCH_PHASE1);
  runDbPush();
  process.exit(0);
}

if (isAdvisoryLockTimeout(migrate.output)) {
  console.warn("");
  console.warn("⚠ migrate deploy bloqueado por advisory lock — sincronizando schema via db push...");
  console.warn("");
  runDbPush();
  process.exit(0);
}

fail("migrate deploy falhou", migrate.output);
