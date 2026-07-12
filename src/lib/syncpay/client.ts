import "server-only";

import { prisma } from "@/lib/prisma";
import { assertSyncPayConfigured } from "@/lib/syncpay/config";

const REQUEST_TIMEOUT_MS = 20_000;
const EXPIRY_SKEW_MS = 60_000;

type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
};

function logSyncPayError(context: string, status?: number) {
  console.error(`[syncpay] ${context}${status != null ? ` status=${status}` : ""}`);
}

async function fetchAuthToken(): Promise<AuthTokenResponse> {
  const cfg = assertSyncPayConfigured();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${cfg.baseUrl}/api/partner/v1/auth-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      logSyncPayError("auth-token failed", res.status);
      throw new Error("SYNCPAY_AUTH_FAILED");
    }
    return (await res.json()) as AuthTokenResponse;
  } catch (err) {
    if (err instanceof Error && err.message === "SYNCPAY_AUTH_FAILED") throw err;
    logSyncPayError("auth-token network/timeout");
    throw new Error("SYNCPAY_AUTH_FAILED");
  } finally {
    clearTimeout(timer);
  }
}

/** Reutiliza o Bearer Token enquanto válido; renova só após expirar. */
export async function getSyncPayAccessToken(): Promise<string> {
  const now = Date.now();
  const cached = await prisma.syncPayAuthCache.findUnique({ where: { id: "singleton" } });
  if (cached && cached.expiresAt.getTime() - EXPIRY_SKEW_MS > now) {
    return cached.accessToken;
  }

  const token = await fetchAuthToken();
  const expiresAt = token.expires_at
    ? new Date(token.expires_at)
    : new Date(now + (token.expires_in || 3600) * 1000);

  await prisma.syncPayAuthCache.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      accessToken: token.access_token,
      expiresAt,
    },
    update: {
      accessToken: token.access_token,
      expiresAt,
    },
  });

  return token.access_token;
}

export type SyncPayRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  searchParams?: Record<string, string | number | undefined>;
};

export async function syncPayRequest<T>(
  path: string,
  options: SyncPayRequestOptions = {}
): Promise<T> {
  const cfg = assertSyncPayConfigured();
  const token = await getSyncPayAccessToken();
  const url = new URL(`${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value == null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.body != null ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body != null ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      logSyncPayError(`${options.method ?? "GET"} ${path}`, res.status);
      throw new Error("SYNCPAY_REQUEST_FAILED");
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("SYNCPAY_")) throw err;
    logSyncPayError(`${options.method ?? "GET"} ${path} network/timeout`);
    throw new Error("SYNCPAY_REQUEST_FAILED");
  } finally {
    clearTimeout(timer);
  }
}
