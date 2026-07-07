import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const canList =
    hasPermission(session.user.role, "companies.manage") ||
    hasPermission(session.user.role, "patients.manage");

  if (!canList) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const where =
    session.user.role === "EMPRESA" && session.user.companyId
      ? { id: session.user.companyId, status: "ACTIVE" as const }
      : { status: "ACTIVE" as const };

  const companies = await prisma.company.findMany({
    where,
    select: { id: true, legalName: true, tradeName: true },
    orderBy: { legalName: "asc" },
  });

  return NextResponse.json(companies);
}
