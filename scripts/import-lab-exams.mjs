/**
 * Importa catálogo de exames laboratoriais (upsert).
 * Schema Exam: name, slug, category(ExamCategory), status(ExamStatus),
 * internalTags (guarda codigo + categoria do arquivo).
 *
 * Uso:
 *   node scripts/extract-lab-catalog.mjs   # gera o JSON a partir do transcript
 *   node scripts/import-lab-exams.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const catalogPath = join(root, "data", "catalogo_exames_laboratoriais_unimetra.json");

const prisma = new PrismaClient();

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildTags({ codigo, categoria }) {
  return [`codigo:${codigo}`, `grupo:${categoria}`, "origem:catalogo-lab-unimetra"].join("|");
}

function parseTags(tags) {
  const out = { codigo: null, grupo: null };
  if (!tags) return out;
  for (const part of String(tags).split("|")) {
    const [k, ...rest] = part.split(":");
    const v = rest.join(":");
    if (k === "codigo") out.codigo = v;
    if (k === "grupo") out.grupo = v;
  }
  return out;
}

async function ensureUniqueSlug(base, used) {
  let slug = base || "exame";
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let i = 2;
  while (used.has(`${slug}-${i}`)) i += 1;
  const next = `${slug}-${i}`;
  used.add(next);
  return next;
}

async function main() {
  if (!existsSync(catalogPath)) {
    console.error(`Arquivo não encontrado: ${catalogPath}`);
    console.error("Rode antes: node scripts/extract-lab-catalog.mjs");
    process.exit(1);
  }

  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  if (!Array.isArray(catalog) || catalog.length === 0) {
    console.error("Catálogo vazio ou inválido.");
    process.exit(1);
  }

  const existing = await prisma.exam.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      status: true,
      internalTags: true,
      shortDescription: true,
    },
  });

  const byNameCat = new Map();
  const byName = new Map();
  const usedSlugs = new Set(existing.map((e) => e.slug));

  for (const exam of existing) {
    const nameKey = normalizeKey(exam.name);
    const tags = parseTags(exam.internalTags);
    const catKey = normalizeKey(tags.grupo ?? "");
    if (catKey) byNameCat.set(`${nameKey}||${catKey}`, exam);
    if (!byName.has(nameKey)) byName.set(nameKey, exam);
  }

  let created = 0;
  let updated = 0;
  let ignored = 0;
  let errors = 0;
  const errorSamples = [];

  for (const row of catalog) {
    try {
      const nome = String(row.nome ?? "").trim();
      const categoriaArquivo = String(row.categoria ?? "").trim();
      const codigo = String(row.codigo ?? "").trim();
      const slugBase = String(row.slug ?? "").trim();

      if (!nome) {
        ignored += 1;
        continue;
      }

      const nameKey = normalizeKey(nome);
      const catKey = normalizeKey(categoriaArquivo);
      const tags = buildTags({ codigo, categoria: categoriaArquivo });

      const match =
        (catKey && byNameCat.get(`${nameKey}||${catKey}`)) ||
        byName.get(nameKey) ||
        null;

      if (match) {
        const sameCategory = match.category === "LABORATORIAL";
        const sameStatus = match.status === "ATIVO";
        const sameTags = (match.internalTags ?? "") === tags;
        const sameName = match.name === nome;

        if (sameCategory && sameStatus && sameTags && sameName) {
          ignored += 1;
          continue;
        }

        await prisma.exam.update({
          where: { id: match.id },
          data: {
            name: nome,
            category: "LABORATORIAL",
            status: "ATIVO",
            internalTags: tags,
            shortDescription: match.shortDescription || `Grupo: ${categoriaArquivo}`,
          },
        });

        // refresh indexes
        byName.set(nameKey, {
          ...match,
          name: nome,
          category: "LABORATORIAL",
          status: "ATIVO",
          internalTags: tags,
        });
        if (catKey) {
          byNameCat.set(`${nameKey}||${catKey}`, {
            ...match,
            name: nome,
            category: "LABORATORIAL",
            status: "ATIVO",
            internalTags: tags,
          });
        }
        updated += 1;
        continue;
      }

      const slug = await ensureUniqueSlug(slugBase || nameKey.replace(/\s+/g, "-"), usedSlugs);

      const createdExam = await prisma.exam.create({
        data: {
          name: nome,
          slug,
          category: "LABORATORIAL",
          status: "ATIVO",
          preparationType: "SEM_PREPARO",
          shortDescription: `Grupo: ${categoriaArquivo}`,
          internalTags: tags,
          showOnWebsite: false,
          availableOnPublicForm: true,
          availableOnCompanyPortal: true,
        },
      });

      byName.set(nameKey, createdExam);
      if (catKey) byNameCat.set(`${nameKey}||${catKey}`, createdExam);
      created += 1;
    } catch (e) {
      errors += 1;
      if (errorSamples.length < 8) {
        errorSamples.push(`${row?.codigo ?? "?"} ${row?.nome ?? "?"}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        totalNoArquivo: catalog.length,
        created,
        updated,
        ignored,
        errors,
        errorSamples,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
