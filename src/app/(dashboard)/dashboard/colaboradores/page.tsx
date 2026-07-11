import { Suspense } from "react";
import { addDays } from "date-fns";
import type { PatientStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthSession } from "@/lib/page-auth";
import { getCompanyFilter, isEmpresaUser } from "@/lib/authz";
import {
  buildCollaboratorWhere,
  COLLABORATOR_STAT_CARDS,
  serializeCollaboratorListItem,
} from "@/lib/collaborators";
import { collaboratorStatCardsForEmpresa } from "@/lib/empresa-portal";
import { ColaboradoresClient } from "@/components/dashboard/collaborators/ColaboradoresClient";
import {
  ColaboradoresEmpresaClient,
  type EmpresaCollaboratorStats,
} from "@/components/dashboard/collaborators/ColaboradoresEmpresaClient";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const v = params[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

async function ColaboradoresData({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await requireAuthSession();
  const companyScope = getCompanyFilter(session).companyId;

  const filters = {
    q: getParam(params, "q") || undefined,
    status: getParam(params, "status") || undefined,
    companyId: getParam(params, "companyId") || undefined,
    jobTitle: getParam(params, "jobTitle") || undefined,
    department: getParam(params, "department") || undefined,
    clinicalExamType: getParam(params, "clinicalExamType") || undefined,
    dateFrom: getParam(params, "dateFrom") || undefined,
    dateTo: getParam(params, "dateTo") || undefined,
    periodicDue: getParam(params, "periodicDue") || undefined,
    docsPending: getParam(params, "docsPending") || undefined,
  };

  const page = Math.max(1, parseInt(getParam(params, "page") || "1", 10) || 1);
  const where = buildCollaboratorWhere(filters, companyScope);
  const skip = (page - 1) * PAGE_SIZE;
  const in30 = addDays(new Date(), 30);

  const isEmpresa = isEmpresaUser(session);
  const statCardDefs = isEmpresa ? collaboratorStatCardsForEmpresa() : COLLABORATOR_STAT_CARDS;

  const patientScope = companyScope ? { companyId: companyScope } : {};

  const [total, patients, countResults, companies, jobTitleRows, departmentRows] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      include: {
        company: true,
        referrals: { orderBy: { createdAt: "desc" }, take: 1 },
        documents: { orderBy: { createdAt: "desc" }, where: { status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO", "VENCIDO"] } } },
      },
      orderBy: { fullName: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    Promise.all(
      isEmpresa
        ? []
        : statCardDefs.map(async (card) => {
        if (card.filter === "ATIVO" || card.filter === "INATIVO") {
          return {
            key: card.key,
            count: await prisma.patient.count({
              where: { ...where, status: card.filter as PatientStatus },
            }),
          };
        }
        if (card.filter === "SCHEDULED") {
          return {
            key: card.key,
            count: await prisma.patient.count({
              where: {
                ...where,
                appointments: {
                  some: {
                    scheduledAt: { gte: new Date() },
                    status: { in: ["AGENDADO", "CONFIRMADO"] },
                  },
                },
              },
            }),
          };
        }
        if (card.filter === "DOCS_PENDING") {
          return {
            key: card.key,
            count: await prisma.patient.count({
              where: {
                ...where,
                documents: { some: { status: { in: ["PENDENTE", "VENCIDO", "EM_ELABORACAO"] } } },
              },
            }),
          };
        }
        if (card.filter === "PERIODIC_DUE") {
          return {
            key: card.key,
            count: await prisma.patient.count({
              where: { ...where, nextPeriodicDate: { lte: in30 } },
            }),
          };
        }
        return {
          key: card.key,
          count: await prisma.patient.count({ where: { ...where, companyId: null } }),
        };
      })
    ),
    isEmpresaUser(session)
      ? prisma.company.findMany({
          where: { id: session.user.companyId! },
          select: { id: true, legalName: true, tradeName: true },
        })
      : prisma.company.findMany({
          where: { status: "ATIVA" },
          select: { id: true, legalName: true, tradeName: true },
          orderBy: { legalName: "asc" },
          take: 200,
        }),
    prisma.patient.findMany({
      where: { ...patientScope, jobTitle: { not: null } },
      distinct: ["jobTitle"],
      select: { jobTitle: true },
      orderBy: { jobTitle: "asc" },
    }),
    prisma.patient.findMany({
      where: { ...patientScope, department: { not: null } },
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" },
    }),
  ]);

  const jobTitles = jobTitleRows
    .map((row) => row.jobTitle?.trim())
    .filter((value): value is string => Boolean(value));
  const departments = departmentRows
    .map((row) => row.department?.trim())
    .filter((value): value is string => Boolean(value));

  const statCounts = Object.fromEntries(countResults.map((c) => [c.key, c.count]));
  const items = patients.map(serializeCollaboratorListItem);
  const canManage =
    isEmpresa ||
    (session.user.role !== "VISUALIZADOR" &&
      session.user.role !== "MEDICO" &&
      session.user.role !== "FINANCEIRO");

  const sharedProps = {
    initialItems: items,
    initialTotal: total,
    initialPage: page,
    pageSize: PAGE_SIZE,
    companies: companies.map((c) => ({
      id: c.id,
      name: c.tradeName ?? c.legalName,
    })),
    jobTitles,
    departments,
    canManage,
    filters,
  };

  if (isEmpresa) {
    const [ativos, inativos, agendados, docsPendentes, periodicosVencer] = await Promise.all([
      prisma.patient.count({ where: { ...patientScope, status: "ATIVO" } }),
      prisma.patient.count({ where: { ...patientScope, status: "INATIVO" } }),
      prisma.patient.count({
        where: {
          ...patientScope,
          appointments: {
            some: {
              scheduledAt: { gte: new Date() },
              status: { in: ["AGENDADO", "CONFIRMADO"] },
            },
          },
        },
      }),
      prisma.patient.count({
        where: {
          ...patientScope,
          documents: { some: { status: { in: ["PENDENTE", "VENCIDO", "EM_ELABORACAO", "EM_EMISSAO"] } } },
        },
      }),
      prisma.patient.count({
        where: { ...patientScope, nextPeriodicDate: { lte: in30 } },
      }),
    ]);

    const stats: EmpresaCollaboratorStats = {
      ativos,
      inativos,
      agendados,
      docsPendentes,
      periodicosVencer,
    };

    return <ColaboradoresEmpresaClient {...sharedProps} stats={stats} />;
  }

  return (
    <ColaboradoresClient
      {...sharedProps}
      statCounts={statCounts}
      isEmpresaPortal={false}
    />
  );
}

export default function ColaboradoresPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
        </div>
      }
    >
      <ColaboradoresData searchParams={searchParams} />
    </Suspense>
  );
}
