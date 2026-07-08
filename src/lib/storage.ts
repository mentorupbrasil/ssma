import "server-only";
import path from "path";
import fs from "fs/promises";

const LOCAL_ROOT = path.join(process.cwd(), "storage");

export type StoredFile = {
  storageKey: string;
  publicUrl: string;
  size: number;
};

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function saveLocal(storageKey: string, buffer: Buffer): Promise<StoredFile> {
  const fullPath = path.join(LOCAL_ROOT, storageKey);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return {
    storageKey,
    publicUrl: `/api/storage/${encodeURIComponent(storageKey)}`,
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

async function saveBlob(storageKey: string, buffer: Buffer, contentType?: string): Promise<StoredFile> {
  const token = process.env.BLOB_READ_WRITE_TOKEN!;
  const res = await fetch(`https://blob.vercel-storage.com/${storageKey}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType ?? "application/octet-stream",
      "x-content-type": contentType ?? "application/octet-stream",
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`Blob upload failed: ${res.statusText}`);
  }
  const data = (await res.json()) as { url: string; pathname?: string };
  return {
    storageKey: data.pathname ?? storageKey,
    publicUrl: data.url,
    size: buffer.length,
  };
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

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  if (useBlobStorage()) {
    const res = await fetch(`https://blob.vercel-storage.com/${storageKey}`, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) throw new Error("FILE_NOT_FOUND");
    return Buffer.from(await res.arrayBuffer());
  }
  return readLocal(storageKey);
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  if (useBlobStorage()) {
    await fetch(`https://blob.vercel-storage.com/${storageKey}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    return;
  }
  await deleteLocal(storageKey);
}
