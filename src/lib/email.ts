import "server-only";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true }
  | { ok: false; error: string };

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Unimetra <noreply@unimetra.local>";

  if (!apiKey) {
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || res.statusText };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao enviar e-mail",
    };
  }
}

export async function notifyUserByEmail(
  userId: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, status: true },
  });
  if (!user?.email || user.status !== "ACTIVE") {
    return { ok: false, skipped: true };
  }
  return sendEmail({ to: user.email, subject, html });
}
