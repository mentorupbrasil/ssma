/**
 * Extrai o array JSON do catálogo a partir do transcript da conversa.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const transcript = join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-Users-Sesmt-OneDrive-Desktop-SSMA",
  "agent-transcripts",
  "444a988b-ea40-4e0a-bdc7-d0153e70445d",
  "444a988b-ea40-4e0a-bdc7-d0153e70445d.jsonl"
);
const outDir = join(root, "data");
const outFile = join(outDir, "catalogo_exames_laboratoriais_unimetra.json");

if (!existsSync(transcript)) {
  console.error("Transcript não encontrado:", transcript);
  process.exit(1);
}

const lines = readFileSync(transcript, "utf8").split(/\r?\n/).filter(Boolean);
let payload = null;

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i].includes("LAB-0001") || !lines[i].includes("catalogo_exames_laboratoriais")) continue;
  try {
    const row = JSON.parse(lines[i]);
    const text = row?.message?.content?.[0]?.text ?? "";
    const start = text.indexOf("\n[\n");
    const endMarker = "\n]- Ao finalizar";
    let end = text.indexOf(endMarker);
    if (start < 0) continue;
    if (end < 0) {
      // fallback: last closing bracket array
      const alt = text.lastIndexOf("\n]");
      if (alt < start) continue;
      end = alt + 2;
    } else {
      end = end + 2; // include ]
    }
    const jsonText = text.slice(start + 1, end).trim();
    payload = JSON.parse(jsonText);
    break;
  } catch {
    // try next
  }
}

if (!payload) {
  // second strategy: find first [ after LAB-0001 block delimiters
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].includes('"codigo": "LAB-0001"')) continue;
    try {
      const row = JSON.parse(lines[i]);
      const text = row?.message?.content?.[0]?.text ?? "";
      const start = text.indexOf('[\n  {\n    "codigo": "LAB-0001"');
      if (start < 0) continue;
      const end = text.indexOf("\n]\n-", start);
      const end2 = end > 0 ? end + 2 : text.indexOf("\n]\n", start) + 2;
      payload = JSON.parse(text.slice(start, end2));
      break;
    } catch (e) {
      console.error("Parse fail:", e.message);
    }
  }
}

if (!Array.isArray(payload)) {
  console.error("Não foi possível extrair o catálogo do transcript.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");
console.log(`OK: ${payload.length} exames → ${outFile}`);
