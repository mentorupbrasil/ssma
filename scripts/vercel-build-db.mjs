#!/usr/bin/env node
/**
 * Vercel build — sincroniza o banco Neon com o schema Prisma.
 *
 * 1. Tenta migrate deploy (quando já houver histórico de migrations).
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

function runPrisma(subcommand, args = []) {
  const fullArgs = ["prisma", subcommand, ...args, "--schema", SCHEMA];
  const result = spawnSync("npx", fullArgs, {
    encoding: "utf8",
    cwd: ROOT,
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
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

console.log("→ prisma migrate deploy");
const migrate = runPrisma("migrate", ["deploy"]);

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
