import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewDocument } from "@/lib/documents";
import { readDocumentFile } from "@/lib/document-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const action = request.nextUrl.searchParams.get("action") === "download" ? "DOWNLOAD" : "VIEW";

  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
      fileMimeType: true,
      sensitive: true,
      type: true,
      companyId: true,
      availableOnPortal: true,
    },
  });

  if (!doc?.fileUrl) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  if (!canViewDocument(session.user.role, doc, session.user.companyId)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  await prisma.$transaction([
    prisma.documentAccessLog.create({
      data: {
        documentId: id,
        userId: session.user.id,
        action,
        ipAddress: ip,
      },
    }),
    prisma.documentHistory.create({
      data: {
        documentId: id,
        action: action === "DOWNLOAD" ? "DOWNLOADED" : "VIEWED",
        performedByUserId: session.user.id,
      },
    }),
  ]);

  const buffer = await readDocumentFile(doc.fileUrl);
  const headers = new Headers();
  headers.set("Content-Type", doc.fileMimeType ?? "application/octet-stream");
  headers.set(
    "Content-Disposition",
    action === "DOWNLOAD"
      ? `attachment; filename="${doc.fileName ?? "documento"}"`
      : `inline; filename="${doc.fileName ?? "documento"}"`
  );

  return new NextResponse(buffer, { headers });
}
