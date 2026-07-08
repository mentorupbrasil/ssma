#!/usr/bin/env node
/**
 * Vercel build — sincroniza o banco Neon com o schema Prisma.
 *
 * 1. Tenta migrate deploy (conexão direta no Neon — pooler não suporta advisory lock).
 * 2. Se P3005 (banco legado sem _prisma_migrations):
 *    a) enums patch (transação separada — ADD VALUE antes de UPDATE)
 *    b) patch SQL principal
 *    c) migration Phase 1 (multi-clinic)
 *    d) db push
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
const MIGRATE_MAX_ATTEMPTS = 3;
const MIGRATE_RETRY_MS = 8000;

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
  const env = { ...process.env };
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

function runMigrateDeploy() {
  const direct = resolveDirectDatabaseUrl();
  if (direct) {
    console.log("→ prisma migrate deploy (conexão direta Neon)");
  } else {
    console.log("→ prisma migrate deploy");
  }

  let last = { status: 1, output: "" };
  for (let attempt = 1; attempt <= MIGRATE_MAX_ATTEMPTS; attempt++) {
    last = runPrisma("migrate", ["deploy"], { useDirect: true });
    if (last.status === 0) return last;
    if (!isAdvisoryLockTimeout(last.output) || attempt === MIGRATE_MAX_ATTEMPTS) {
      return last;
    }
    console.warn(
      `⚠ Advisory lock ocupado (tentativa ${attempt}/${MIGRATE_MAX_ATTEMPTS}) — aguardando ${MIGRATE_RETRY_MS / 1000}s...`,
    );
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

if (!isLegacyDb) {
  fail("migrate deploy falhou", migrate.output);
}

console.warn("");
console.warn("⚠ Banco legado (sem histórico de migrations) — aplicando patches SQL...");
console.warn("");

runSqlPatch("patch enums", PATCH_ENUMS);
runSqlPatch("patch schema", PATCH);
runSqlPatch("patch phase 1", PATCH_PHASE1);

console.log("→ prisma db push");
const push = runPrisma("db", ["push", "--skip-generate", "--accept-data-loss"]);
if (push.status !== 0) {
  fail("db push falhou", push.output);
}

console.log("✓ Banco sincronizado");
process.exit(0);
