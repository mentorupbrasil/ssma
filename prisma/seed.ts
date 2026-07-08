import dotenv from "dotenv";

dotenv.config({ override: true });

import { PrismaClient, ExamCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATALOG_SEED_EXAMS } from "../src/lib/exams";
import { BLOG_POSTS } from "../src/data/services";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const clinic = await prisma.clinic.upsert({
    where: { slug: "unimetra" },
    update: {},
    create: {
      id: "clinic_default_unimetra",
      name: "Unimetra",
      slug: "unimetra",
      status: "ATIVA",
      plan: "PROFISSIONAL",
      responsibleName: "Administrador",
      email: "contato@unimetra.com.br",
      whatsapp: "5599992033813",
    },
  });

  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await prisma.user.upsert({
    where: { email: "super@demo.com" },
    update: { role: "SUPER_ADMIN" },
    create: {
      name: "Super Admin Demo",
      email: "super@demo.com",
      passwordHash: await bcrypt.hash("Super@123", 12),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: { role: "CLINIC_ADMIN", clinicId: clinic.id },
    create: {
      name: "Administrador Demo",
      email: "admin@demo.com",
      passwordHash,
      role: "CLINIC_ADMIN",
      status: "ACTIVE",
      clinicId: clinic.id,
    },
  });

  const recepcao = await prisma.user.upsert({
    where: { email: "recepcao@demo.com" },
    update: { role: "RECEPTION", clinicId: clinic.id },
    create: {
      name: "Maria Recepção",
      email: "recepcao@demo.com",
      passwordHash: await bcrypt.hash("Recepcao@123", 12),
      role: "RECEPTION",
      status: "ACTIVE",
      clinicId: clinic.id,
    },
  });

  for (const exam of CATALOG_SEED_EXAMS) {
    await prisma.exam.upsert({
      where: { slug: exam.slug },
      update: {
        name: exam.name,
        category: exam.category,
        shortDescription: exam.shortDescription,
        preparationType: exam.preparationType,
        preparationBefore: exam.preparationBefore,
        instructionsOnDay: exam.instructionsOnDay,
        averageDeadline: exam.averageDeadline,
        deadlineType: exam.deadlineType,
        observations: exam.observations,
        whenToNotifyClinic: exam.whenToNotifyClinic,
        requiresAppointment: exam.requiresAppointment ?? false,
        displayOrder: exam.displayOrder ?? null,
        status: "ATIVO",
        showOnWebsite: true,
        availableOnPublicForm: true,
        availableOnCompanyPortal: true,
      },
      create: {
        name: exam.name,
        slug: exam.slug,
        category: exam.category,
        shortDescription: exam.shortDescription,
        preparationType: exam.preparationType,
        preparationBefore: exam.preparationBefore,
        instructionsOnDay: exam.instructionsOnDay,
        averageDeadline: exam.averageDeadline,
        deadlineType: exam.deadlineType,
        observations: exam.observations,
        whenToNotifyClinic: exam.whenToNotifyClinic,
        requiresAppointment: exam.requiresAppointment ?? false,
        displayOrder: exam.displayOrder ?? null,
        status: "ATIVO",
        showOnWebsite: true,
        availableOnPublicForm: true,
        availableOnCompanyPortal: true,
      },
    });
  }

  const company1 = await prisma.company.upsert({
    where: { cnpj: "12345678000190" },
    update: { clinicId: clinic.id },
    create: {
      legalName: "Indústria Alfa Ltda",
      tradeName: "Alfa Indústria",
      cnpj: "12345678000190",
      clinicId: clinic.id,
      email: "rh@alfa-demo.com.br",
      phone: "(11) 3000-1000",
      whatsapp: "551130001000",
      address: "Rua das Indústrias, 500",
      city: "São Paulo",
      state: "SP",
      responsibleName: "João Silva",
      status: "ATIVA",
    },
  });

  const company2 = await prisma.company.upsert({
    where: { cnpj: "98765432000110" },
    update: { clinicId: clinic.id },
    create: {
      legalName: "Comércio Beta S.A.",
      tradeName: "Beta Comércio",
      cnpj: "98765432000110",
      clinicId: clinic.id,
      email: "rh@beta-demo.com.br",
      phone: "(11) 3000-2000",
      city: "Guarulhos",
      state: "SP",
      responsibleName: "Ana Costa",
      status: "ATIVA",
    },
  });

  await prisma.user.upsert({
    where: { email: "empresa@demo.com" },
    update: { role: "COMPANY_HR", clinicId: clinic.id },
    create: {
      name: "Portal Empresa Alfa",
      email: "empresa@demo.com",
      passwordHash: await bcrypt.hash("Empresa@123", 12),
      role: "COMPANY_HR",
      status: "ACTIVE",
      companyId: company1.id,
      clinicId: clinic.id,
    },
  });

  const patient1 = await prisma.patient.upsert({
    where: { cpf: "52998224725" },
    update: {},
    create: {
      fullName: "Carlos Eduardo Santos",
      cpf: "52998224725",
      rg: "123456789",
      birthDate: new Date("1985-03-15"),
      gender: "M",
      phone: "(11) 99000-1001",
      jobTitle: "Operador de máquinas",
      department: "Produção",
      companyId: company1.id,
      status: "ATIVO",
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { cpf: "39053344705" },
    update: {},
    create: {
      fullName: "Fernanda Lima Oliveira",
      cpf: "39053344705",
      birthDate: new Date("1990-07-22"),
      gender: "F",
      phone: "(11) 99000-2002",
      jobTitle: "Auxiliar administrativo",
      department: "Administrativo",
      companyId: company2.id,
      status: "ATIVO",
    },
  });

  const referrals = [
    {
      protocol: "UNI-2026-000001",
      companyId: company1.id,
      patientId: patient1.id,
      clinicalExamType: "PERIODICO" as const,
      status: "EM_ATENDIMENTO" as const,
      authorizerName: "João Silva",
      assignedToId: recepcao.id,
    },
    {
      protocol: "UNI-2026-000002",
      companyId: company2.id,
      patientId: patient2.id,
      clinicalExamType: "ADMISSIONAL" as const,
      status: "NOVO" as const,
      authorizerName: "Ana Costa",
    },
    {
      protocol: "UNI-2026-000003",
      companyId: company1.id,
      patientId: patient1.id,
      clinicalExamType: "MUDANCA_FUNCAO" as const,
      status: "AGENDADO" as const,
      authorizerName: "João Silva",
      assignedToId: recepcao.id,
    },
  ];

  for (const ref of referrals) {
    const existing = await prisma.referral.findUnique({
      where: { protocol: ref.protocol },
    });
    if (!existing) {
      const referral = await prisma.referral.create({
        data: {
          ...ref,
          consentAccepted: true,
          source: "ADMIN",
          exams: {
            create: [
              { examName: "Audiometria", category: ExamCategory.COMPLEMENTAR },
              { examName: "Espirometria", category: ExamCategory.COMPLEMENTAR },
              { examName: "Hemograma completo", category: ExamCategory.LABORATORIAL },
            ],
          },
        },
      });

      await prisma.appointment.create({
        data: {
          title: `Atendimento ${ref.protocol}`,
          scheduledAt: new Date(Date.now() + 86400000 * 2),
          status: ref.status === "AGENDADO" ? "AGENDADO" : "CONFIRMADO",
          type: "Exame ocupacional",
          companyId: ref.companyId,
          patientId: ref.patientId,
          referralId: referral.id,
        },
      });
    }
  }

  await prisma.lead.createMany({
    data: [
      {
        type: "ORCAMENTO",
        status: "NOVO",
        name: "Roberto Mendes",
        email: "roberto@empresa-demo.com",
        phone: "(11) 98000-3000",
        companyName: "Transportes Gama",
        serviceInterest: "PCMSO e exames ocupacionais",
        message: "Preciso de orçamento para 50 colaboradores",
        source: "site",
      },
      {
        type: "ORCAMENTO",
        status: "EM_ANALISE",
        name: "Patrícia Souza",
        email: "patricia@loja-demo.com",
        phone: "(11) 98000-4000",
        companyName: "Beta Comércio",
        serviceInterest: "Portal empresarial",
        message: "Gostaria de conhecer o portal para RH",
        source: "site",
      },
    ],
    skipDuplicates: true,
  });

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@demo.com" } });
  if (adminUser) {
    const existingQuote = await prisma.quote.findUnique({ where: { quoteNumber: "ORC-2026-0001" } });
    if (!existingQuote) {
      const company1 = await prisma.company.findUnique({ where: { cnpj: "12345678000190" } });
      await prisma.quote.create({
        data: {
          quoteNumber: "ORC-2026-0001",
          companyId: company1?.id,
          companyName: "Alfa Indústria",
          responsibleName: "João Silva",
          phone: "(11) 3000-1000",
          email: "rh@alfa-demo.com.br",
          status: "AGUARDANDO_RESPOSTA",
          totalAmount: 4500,
          validUntil: new Date(Date.now() + 30 * 86400000),
          paymentTerms: "Faturamento mensal",
          clientNotes: "Proposta válida para até 80 colaboradores ativos.",
          createdByUserId: adminUser.id,
          items: {
            create: [
              { serviceName: "PCMSO", quantity: 1, totalPrice: 2500, sortOrder: 0 },
              { serviceName: "Exames complementares", quantity: 1, totalPrice: 2000, sortOrder: 1 },
            ],
          },
        },
      });
    }
  }

  const onlineReferral = await prisma.referral.findUnique({
    where: { protocol: "UNI-2026-000004" },
  });
  if (!onlineReferral) {
    await prisma.referral.create({
      data: {
        protocol: "UNI-2026-000004",
        companyId: company2.id,
        patientId: patient2.id,
        clinicalExamType: "PERIODICO",
        status: "NOVO",
        authorizerName: "Ana Costa",
        companyPhone: "(11) 3000-2000",
        companyEmail: "rh@beta-demo.com.br",
        consentAccepted: true,
        source: "SITE",
        exams: {
          create: [{ examName: "Acuidade visual", category: ExamCategory.COMPLEMENTAR }],
        },
      },
    });
  }

  const referralCarlos = await prisma.referral.findUnique({
    where: { protocol: "UNI-2026-000001" },
    select: { id: true },
  });

  await prisma.document.createMany({
    data: [
      {
        title: "ASO — Carlos Eduardo Santos",
        type: "ASO",
        status: "PENDENTE",
        companyId: company1.id,
        patientId: patient1.id,
        referralId: referralCarlos?.id,
        sensitive: true,
        asoClinicalType: "ADMISSIONAL",
      },
      {
        title: "PCMSO — Alfa Indústria",
        type: "PCMSO",
        status: "DISPONIVEL",
        companyId: company1.id,
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        availableOnPortal: true,
      },
      {
        title: "PGR — Alfa Indústria",
        type: "PGR",
        status: "EM_EMISSAO",
        companyId: company1.id,
      },
    ],
    skipDuplicates: true,
  });

  for (const post of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        published: true,
      },
    });
  }

  const settings = [
    { key: "clinic_name", value: "Unimetra" },
    { key: "clinic_phone", value: "(11) 3456-7890" },
    { key: "clinic_whatsapp", value: "551134567890" },
    { key: "clinic_email", value: "contato@unimetra.com.br" },
    { key: "clinic_address", value: "Av. Paulista, 1000 — São Paulo/SP" },
    { key: "clinic_hours", value: "Seg-Sex 7h-18h | Sáb 7h-12h" },
    { key: "lgpd_contact", value: "privacidade@unimetra.com.br" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { clinicId_key: { clinicId: DEFAULT_CLINIC_ID, key: s.key } },
      update: { value: s.value },
      create: { ...s, clinicId: DEFAULT_CLINIC_ID },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED",
      entity: "System",
      details: "Seed inicial executado com sucesso",
    },
  });

  console.log("✅ Seed concluído!");
  console.log("   Super Admin: super@demo.com / Super@123");
  console.log("   Admin clínica: admin@demo.com / Admin@123");
  console.log("   Recepção: recepcao@demo.com / Recepcao@123");
  console.log("   Empresa/RH: empresa@demo.com / Empresa@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
