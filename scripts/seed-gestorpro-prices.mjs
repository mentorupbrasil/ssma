import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** CNPJ válido (dígitos verificadores corretos), fictício para demo */
const CNPJ = "11222333000181";

function priceForExam(name, index) {
  // Faixa realista por tipo de exame (valores inventados)
  const n = name.toLowerCase();
  let base = 45;
  if (n.includes("pcr") || n.includes("molecular") || n.includes("genotip")) base = 280;
  else if (n.includes("painel")) base = 420;
  else if (n.includes("carga viral") || n.includes("rna viral") || n.includes("dna viral")) base = 350;
  else if (n.includes("imunofenotip")) base = 320;
  else if (n.includes("eletroforese")) base = 95;
  else if (n.includes("hemograma") || n.includes("glicemia") || n.includes("urina tipo")) base = 28;
  else if (n.includes("cultura") || n.includes("urocultura") || n.includes("hemocultura")) base = 75;
  else if (n.includes("hormônio") || n.includes("hormonio") || n.includes("tsh") || n.includes("t4") || n.includes("t3")) base = 55;
  else if (n.includes("anticorpo") || n.includes("sorolog") || n.includes("igg") || n.includes("igm")) base = 68;
  else if (n.includes("vitamina")) base = 72;
  else if (n.includes("toxicolog") || n.includes("chumbo") || n.includes("mercúrio") || n.includes("mercurio")) base = 110;
  else if (n.includes("psa") || n.includes("ca 1") || n.includes("cea") || n.includes("marcador")) base = 85;
  else base = 40 + (index % 17) * 3;

  // Pequena variação estável por índice
  const cents = ((index * 7) % 90) / 100;
  return Math.round((base + cents) * 100) / 100;
}

async function main() {
  const examCount = await prisma.exam.count({ where: { status: "ATIVO" } });
  console.log(`Exames ativos: ${examCount}`);

  let company = await prisma.company.findFirst({
    where: {
      OR: [
        { legalName: { contains: "GestorPro", mode: "insensitive" } },
        { tradeName: { contains: "GestorPro", mode: "insensitive" } },
        { cnpj: CNPJ },
      ],
    },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        legalName: "GestorPro Soluções em SST Ltda",
        tradeName: "GestorPro",
        cnpj: CNPJ,
        email: "contato@gestorpro.demo",
        phone: "1133334444",
        whatsapp: "11999998888",
        city: "São Paulo",
        state: "SP",
        address: "Av. Paulista, 1000",
        zipCode: "01310100",
        responsibleName: "Ana Souza",
        responsibleRole: "RH / SST",
        segment: "Tecnologia",
        status: "ATIVA",
        portalEnabled: true,
        notes: "Empresa demo — pacote completo de exames laboratoriais.",
      },
    });
    console.log(`Empresa criada: ${company.id}`);
  } else {
    console.log(`Empresa já existia: ${company.id}`);
  }

  const exams = await prisma.exam.findMany({
    where: { status: "ATIVO" },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  // Preços padrão (catálogo) + preços negociados por empresa
  let defaultsCreated = 0;
  let defaultsUpdated = 0;
  let companyCreated = 0;
  let companyUpdated = 0;

  for (let i = 0; i < exams.length; i++) {
    const exam = exams[i];
    const price = priceForExam(exam.name, i);
    // Negociado ~10% abaixo do padrão
    const negotiated = Math.round(price * 0.9 * 100) / 100;

    let defaultItem = await prisma.priceListItem.findFirst({
      where: {
        companyId: null,
        OR: [{ examId: exam.id }, { name: { equals: exam.name, mode: "insensitive" } }],
      },
    });

    if (!defaultItem) {
      defaultItem = await prisma.priceListItem.create({
        data: {
          name: exam.name,
          category: "EXAME",
          examId: exam.id,
          defaultPrice: price,
          companyId: null,
          chargeType: "AVULSA",
          status: "ATIVA",
          notes: "Preço padrão demo",
        },
      });
      defaultsCreated += 1;
    } else if (!(defaultItem.defaultPrice > 0)) {
      await prisma.priceListItem.update({
        where: { id: defaultItem.id },
        data: { defaultPrice: price, examId: exam.id, status: "ATIVA" },
      });
      defaultsUpdated += 1;
    }

    const existingCompany = await prisma.priceListItem.findFirst({
      where: {
        companyId: company.id,
        OR: [{ examId: exam.id }, { name: { equals: exam.name, mode: "insensitive" } }],
      },
    });

    if (!existingCompany) {
      await prisma.priceListItem.create({
        data: {
          name: exam.name,
          category: "EXAME",
          examId: exam.id,
          defaultPrice: defaultItem.defaultPrice > 0 ? defaultItem.defaultPrice : price,
          negotiatedPrice: negotiated,
          companyId: company.id,
          chargeType: "PACOTE",
          status: "ATIVA",
          validFrom: new Date(),
          notes: "Pacote GestorPro — valor negociado",
        },
      });
      companyCreated += 1;
    } else {
      await prisma.priceListItem.update({
        where: { id: existingCompany.id },
        data: {
          examId: exam.id,
          defaultPrice: defaultItem.defaultPrice > 0 ? defaultItem.defaultPrice : price,
          negotiatedPrice: negotiated,
          chargeType: "PACOTE",
          status: "ATIVA",
          notes: "Pacote GestorPro — valor negociado",
        },
      });
      companyUpdated += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        companyId: company.id,
        companyName: company.tradeName ?? company.legalName,
        cnpj: company.cnpj,
        exams: exams.length,
        defaultsCreated,
        defaultsUpdated,
        companyPricesCreated: companyCreated,
        companyPricesUpdated: companyUpdated,
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
