import { NextResponse } from "next/server";
import { processSyncPayWebhook } from "@/lib/syncpay/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await processSyncPayWebhook({
    authorizationHeader: request.headers.get("authorization"),
    headerEvent: request.headers.get("event"),
    body,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: result.status });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
