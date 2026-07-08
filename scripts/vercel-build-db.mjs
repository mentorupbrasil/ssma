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
const MIGRATE_MAX_ATTEMPTS = 6;
const MIGRATE_RETRY_MS = 8000;

/** Neon pooler não suporta pg_advisory_lock — migrate precisa da URL direta. */
function resolveDirectDatabaseUrl() {
  if (process.env.DIRECT_URL) return withConnectTimeout(process.env.DIRECT_URL);
  const pooled = process.env.DATABASE_URL;
  if (!pooled) return null;
  if (pooled.includes("-pooler.")) {
    return withConnectTimeout(pooled.replace("-pooler.", "."));
  }
  return withConnectTimeout(pooled);
}

/** Aumenta tolerância ao cold start do Neon durante o build na Vercel. */
function withConnectTimeout(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "30");
    }
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    if (url.includes("connect_timeout")) return url;
    return `${url}${sep}connect_timeout=30&sslmode=require`;
  }
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
    stdio: options.stdin ? ["pipe", "pipe", "pipe"] : ["inherit", "pipe", "pipe"],
    input: options.stdin,
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

function isConnectionError(output) {
  return (
    output.includes("P1001") ||
    output.includes("P1000") ||
    output.includes("Can't reach database server") ||
    output.includes("ECONNREFUSED") ||
    output.includes("ETIMEDOUT") ||
    output.includes("Connection timed out")
  );
}

function wakeDatabase() {
  const direct = resolveDirectDatabaseUrl();
  if (!direct) return;
  console.log("→ acordando banco Neon (SELECT 1)");
  runPrisma("db", ["execute", "--stdin"], {
    useDirect: true,
    extraEnv: {},
    stdin: "SELECT 1;",
  });
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

  let last = { status: 1, output: "" };
  for (let attempt = 1; attempt <= MIGRATE_MAX_ATTEMPTS; attempt++) {
    last = runPrisma("db", ["push", "--skip-generate", "--accept-data-loss"]);
    if (last.status === 0) {
      console.log("✓ Schema sincronizado");
      return;
    }
    if (!isConnectionError(last.output) || attempt === MIGRATE_MAX_ATTEMPTS) {
      fail("db push falhou", last.output);
    }
    console.warn(`⚠ db push: banco indisponível — tentativa ${attempt}/${MIGRATE_MAX_ATTEMPTS}...`);
    sleep(MIGRATE_RETRY_MS);
  }
}

function runMigrateDeploy() {
  releaseStaleMigrateLocks();
  wakeDatabase();

  const direct = resolveDirectDatabaseUrl();
  if (direct) {
    console.log("→ prisma migrate deploy (conexão direta Neon, CI)");
  } else {
    console.warn("⚠ DIRECT_URL não definida — derive de DATABASE_URL ou configure na Vercel");
    console.log("→ prisma migrate deploy");
  }

  const migrateEnv = { PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1" };

  let last = { status: 1, output: "" };
  for (let attempt = 1; attempt <= MIGRATE_MAX_ATTEMPTS; attempt++) {
    last = runPrisma("migrate", ["deploy"], { useDirect: true, extraEnv: migrateEnv });
    if (last.status === 0) return last;

    const retryable =
      isAdvisoryLockTimeout(last.output) || isConnectionError(last.output);
    if (!retryable || attempt === MIGRATE_MAX_ATTEMPTS) {
      return last;
    }

    const reason = isConnectionError(last.output) ? "banco indisponível (cold start?)" : "advisory lock";
    console.warn(
      `⚠ ${reason} — tentativa ${attempt}/${MIGRATE_MAX_ATTEMPTS}, aguardando ${MIGRATE_RETRY_MS / 1000}s...`,
    );
    releaseStaleMigrateLocks();
    wakeDatabase();
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

if (isConnectionError(migrate.output)) {
  console.warn("");
  console.warn("⚠ migrate deploy não alcançou o Neon — tentando db push como fallback...");
  console.warn("  Verifique DIRECT_URL na Vercel (URL direta, sem -pooler).");
  console.warn("");
  runDbPush("prisma db push (fallback após P1001)");
  process.exit(0);
}

fail("migrate deploy falhou", migrate.output);
