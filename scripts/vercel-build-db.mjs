#!/usr/bin/env node
/**
 * Vercel build: apply Prisma schema to Neon.
 *
 * - Tries `migrate deploy` when migration history exists.
 * - On P3005 (DB created earlier via db push, no _prisma_migrations),
 *   runs idempotent SQL patch then `db push`.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patchFile = path.join(__dirname, "production-schema-patch.sql");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
}

console.log("→ Applying database schema (prisma migrate deploy)...");

const migrate = run("npx", ["prisma", "migrate", "deploy"]);

if (migrate.status === 0) {
  console.log("✓ Migrations applied");
  process.exit(0);
}

const output = `${migrate.stdout ?? ""}${migrate.stderr ?? ""}`;

if (output.includes("P3005")) {
  console.warn("");
  console.warn("⚠ P3005: o banco já existia sem histórico de migrations.");
  console.warn("→ Aplicando patch SQL idempotente...");
  console.warn("");

  const patch = run("npx", ["prisma", "db", "execute", "--file", patchFile]);
  if (patch.status !== 0) {
    process.stderr.write(patch.stdout ?? "");
    process.stderr.write(patch.stderr ?? "");
    console.warn("⚠ Patch SQL falhou ou parcial — tentando db push mesmo assim...");
  } else {
    console.log("✓ Patch SQL aplicado");
  }

  console.warn("→ Sincronizando schema com prisma db push...");
  const push = run("npx", ["prisma", "db", "push", "--skip-generate"]);
  if (push.status !== 0) {
    process.stderr.write(push.stdout ?? "");
    process.stderr.write(push.stderr ?? "");
    process.exit(push.status ?? 1);
  }

  console.log("✓ Schema synchronized via db push");
  process.exit(0);
}

process.stderr.write(output);
process.exit(migrate.status ?? 1);
