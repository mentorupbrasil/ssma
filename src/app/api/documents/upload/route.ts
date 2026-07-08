import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  saveDocumentFile,
} from "@/lib/document-storage";
import { attachFileToDocument, createDocument } from "@/actions/documents";
import type { DocumentType } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.role, "documents.manage")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;
    const title = (formData.get("title") as string) || file?.name || "Documento";
    const type = ((formData.get("type") as string) || "OUTRO") as DocumentType;
    const makeAvailable = formData.get("makeAvailable") === "true";

    if (!file) {
      return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo excede o limite de 15 MB." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (documentId) {
      const { relativePath, size } = await saveDocumentFile(documentId, file.name, buffer);
      const result = await attachFileToDocument(
        documentId,
        {
          fileName: file.name,
          fileUrl: relativePath,
          fileMimeType: file.type,
          fileSize: size,
        },
        makeAvailable
      );
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, documentId });
    }

    const createResult = await createDocument({
      title,
      type,
      companyId: (formData.get("companyId") as string) || null,
      patientId: (formData.get("patientId") as string) || null,
      referralId: (formData.get("referralId") as string) || null,
      examId: (formData.get("examId") as string) || null,
      quoteId: (formData.get("quoteId") as string) || null,
      makeAvailable,
      status: makeAvailable ? "DISPONIVEL" : "PENDENTE",
    });

    if (!createResult.success) {
      return NextResponse.json({ error: createResult.error }, { status: 400 });
    }

    const newId = createResult.documentId;
    const { relativePath, size } = await saveDocumentFile(newId, file.name, buffer);
    await attachFileToDocument(
      newId,
      {
        fileName: file.name,
        fileUrl: relativePath,
        fileMimeType: file.type,
        fileSize: size,
      },
      makeAvailable
    );

    return NextResponse.json({ success: true, documentId: newId });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Erro ao enviar arquivo." }, { status: 500 });
  }
}
