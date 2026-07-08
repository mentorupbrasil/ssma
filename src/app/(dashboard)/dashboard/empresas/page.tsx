import { Suspense } from "react";
import type { CompanyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthSession } from "@/lib/page-auth";
import {
  buildCompanyWhere,
  COMPANY_STAT_CARDS,
  OPEN_REFERRAL_STATUSES,
import { PENDING_QUOTE_STATUSES } from "@/lib/commercial";
  serializeCompanyListItem,
} from "@/lib/companies";
import { EmpresasClient } from "@/components/dashboard/companies/EmpresasClient";
import { getCompanyCities } from "@/actions/companies";
import { canEditCompanyCommercial } from "@/lib/companies";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function EmpresasData({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await requireAuthSession();

  const filters = {
    q: getParam(params, "q") || undefined,
    status: getParam(params, "status") || undefined,
    city: getParam(params, "city") || undefined,
    size: getParam(params, "size") || undefined,
    contractType: getParam(params, "contractType") || undefined,
    pending: getParam(params, "pending") || undefined,
    dateFrom: getParam(params, "dateFrom") || undefined,
    dateTo: getParam(params, "dateTo") || undefined,
  };

  const page = Math.max(1, parseInt(getParam(params, "page") || "1", 10) || 1);
  const where = buildCompanyWhere(filters);
  const skip = (page - 1) * PAGE_SIZE;

  const [total, companies, countResults, cities] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      include: {
        _count: { select: { patients: true, referrals: true, documents: true } },
        documents: { select: { status: true, validUntil: true }, take: 20 },
        referrals: {
          where: { status: { in: OPEN_REFERRAL_STATUSES } },
          select: { id: true },
        },
      },
      orderBy: { legalName: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    Promise.all(
      COMPANY_STAT_CARDS.map(async (card) => {
        if (card.filter === "ATIVA" || card.filter === "INATIVA") {
          return {
            key: card.key,
            count: await prisma.company.count({
              where: { status: card.filter as CompanyStatus },
            }),
          };
        }
        if (card.filter === "DOCS_PENDING") {
          return {
            key: card.key,
            count: await prisma.company.count({
              where: {
                documents: { some: { status: { in: ["PENDENTE", "EM_ELABORACAO", "VENCIDO"] } } },
              },
            }),
          };
        }
        if (card.filter === "REFERRALS_OPEN") {
          return {
            key: card.key,
            count: await prisma.company.count({
              where: { referrals: { some: { status: { in: OPEN_REFERRAL_STATUSES } } } },
            }),
          };
        }
        return {
          key: card.key,
          count: await prisma.company.count({
            where: { quotes: { some: { status: { in: PENDING_QUOTE_STATUSES } } } },
          }),
        };
      })
    ),
    getCompanyCities(),
  ]);

  const statCounts = Object.fromEntries(countResults.map((c) => [c.key, c.count]));
  const items = companies.map(serializeCompanyListItem);

  const canManage = session.user.role !== "VISUALIZADOR" && session.user.role !== "MEDICO";
  const canCommercial = canEditCompanyCommercial(session.user.role);

  return (
    <EmpresasClient
      initialItems={items}
      initialTotal={total}
      initialPage={page}
      pageSize={PAGE_SIZE}
      statCounts={statCounts}
      cities={cities}
      canManage={canManage}
      canCommercial={canCommercial}
      filters={filters}
    />
  );
}

export default function EmpresasPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
        </div>
      }
    >
      <EmpresasData searchParams={searchParams} />
    </Suspense>
  );
}
