import "server-only";
import { deleteStoredFile, readStoredFile, storeFile } from "@/lib/storage";

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function getRelativeStorageKey(documentId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `documents/${documentId}/${safeName}`;
}

export async function saveDocumentFile(
  documentId: string,
  fileName: string,
  buffer: Buffer,
  contentType?: string
): Promise<{ relativePath: string; size: number }> {
  const storageKey = getRelativeStorageKey(documentId, fileName);
  const stored = await storeFile(storageKey, buffer, contentType);
  return { relativePath: stored.storageKey, size: stored.size };
}

export async function readDocumentFile(relativePath: string): Promise<Buffer> {
  return readStoredFile(relativePath);
}

export async function deleteDocumentFile(relativePath: string): Promise<void> {
  return deleteStoredFile(relativePath);
}
