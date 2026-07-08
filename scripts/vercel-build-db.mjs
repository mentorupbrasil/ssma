#!/usr/bin/env node
/**
 * Vercel build — sincroniza o banco Neon com o schema Prisma.
 *
 * 1. Tenta migrate deploy (quando já houver histórico de migrations).
 * 2. Se P3005 (banco legado sem _prisma_migrations): patch SQL + db push.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SCHEMA = "prisma/schema.prisma";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PATCH = path.join(ROOT, "scripts", "production-schema-patch.sql");

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
console.warn("⚠ Banco legado (sem histórico de migrations) — aplicando patch SQL...");
console.warn("");

const patch = runPrisma("db", ["execute", "--file", PATCH]);
if (patch.status !== 0) {
  fail("Patch SQL falhou", patch.output);
}
console.log("✓ Patch SQL aplicado");

console.log("→ prisma db push");
const push = runPrisma("db", ["push", "--skip-generate", "--accept-data-loss"]);
if (push.status !== 0) {
  fail("db push falhou", push.output);
}

console.log("✓ Banco sincronizado");
process.exit(0);
