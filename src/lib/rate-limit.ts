import "server-only";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Limite simples em memória por chave (IP/fingerprint). Adequado para MVP serverless. */
export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }

  if (bucket.count >= opts.limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

export async function getRequestRateLimitKey(prefix: string): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = h.get("x-real-ip")?.trim();
    return `${prefix}:${forwarded ?? realIp ?? "unknown"}`;
  } catch {
    return `${prefix}:unknown`;
  }
}

export function enforcePublicFormRateLimit(key: string) {
  const result = checkRateLimit(key, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!result.ok) {
    throw new Error(
      `Muitas tentativas. Aguarde ${result.retryAfterSec} segundos e tente novamente.`
    );
  }
}
