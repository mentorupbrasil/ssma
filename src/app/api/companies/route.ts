import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const where = session.user.role === "EMPRESA" && session.user.companyId
    ? { id: session.user.companyId, status: "ACTIVE" as const }
    : { status: "ACTIVE" as const };

  const companies = await prisma.company.findMany({
    where,
    select: { id: true, legalName: true, tradeName: true },
    orderBy: { legalName: "asc" },
  });

  return NextResponse.json(companies);
}
