import "server-only";
import path from "path";
import fs from "fs/promises";
import { del, get, put } from "@vercel/blob";

const LOCAL_ROOT = path.join(process.cwd(), "storage");

export type StoredFile = {
  storageKey: string;
  publicUrl: string;
  size: number;
};

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function isRemoteRef(ref: string) {
  return ref.startsWith("http://") || ref.startsWith("https://");
}

async function saveLocal(storageKey: string, buffer: Buffer): Promise<StoredFile> {
  const fullPath = path.join(LOCAL_ROOT, storageKey);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return {
    storageKey,
    publicUrl: `/api/documents/local/${encodeURIComponent(storageKey)}`,
    size: buffer.length,
  };
}

async function readLocal(storageKey: string): Promise<Buffer> {
  return fs.readFile(path.join(LOCAL_ROOT, storageKey));
}

async function deleteLocal(storageKey: string): Promise<void> {
  try {
    await fs.unlink(path.join(LOCAL_ROOT, storageKey));
  } catch {
    /* ignore missing file */
  }
}

async function saveBlob(
  storageKey: string,
  buffer: Buffer,
  contentType?: string
): Promise<StoredFile> {
  const blob = await put(storageKey, buffer, {
    access: "private",
    contentType: contentType ?? "application/octet-stream",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: blobToken(),
  });

  return {
    storageKey: blob.pathname,
    publicUrl: blob.url,
    size: buffer.length,
  };
}

async function readBlob(ref: string): Promise<Buffer> {
  const result = await get(ref, {
    access: "private",
    token: blobToken(),
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("FILE_NOT_FOUND");
  }

  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

async function deleteBlob(ref: string): Promise<void> {
  try {
    await del(ref, { token: blobToken() });
  } catch {
    /* ignore missing blob */
  }
}

export async function storeFile(
  storageKey: string,
  buffer: Buffer,
  contentType?: string
): Promise<StoredFile> {
  if (useBlobStorage()) {
    return saveBlob(storageKey, buffer, contentType);
  }
  return saveLocal(storageKey, buffer);
}

export async function readStoredFile(ref: string): Promise<Buffer> {
  if (isRemoteRef(ref) || useBlobStorage()) {
    return readBlob(ref);
  }
  return readLocal(ref);
}

export async function deleteStoredFile(ref: string): Promise<void> {
  if (isRemoteRef(ref) || useBlobStorage()) {
    await deleteBlob(ref);
    return;
  }
  await deleteLocal(ref);
}

export function isBlobStorageEnabled() {
  return useBlobStorage();
}
