import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ContactMessageStatusForm } from "@/components/dashboard/ContactMessageStatusForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/helpers";

export default async function MensagemContatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("leads.manage");
  const { id } = await params;

  let message = null;
  try {
    message = await prisma.contactMessage.findUnique({ where: { id } });
  } catch {
    notFound();
  }
  if (!message) notFound();

  return (
    <div>
      <PageHeader title={message.name} description={message.subject}>
        <Link href="/dashboard/orcamentos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={message.status} type="contact" />
        <ContactMessageStatusForm messageId={message.id} currentStatus={message.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium text-slate-700">Telefone:</span>{" "}
            {formatPhone(message.phone)}
          </p>
          {message.email && (
            <p>
              <span className="font-medium text-slate-700">E-mail:</span> {message.email}
            </p>
          )}
          {message.company && (
            <p>
              <span className="font-medium text-slate-700">Empresa:</span> {message.company}
            </p>
          )}
          <p>
            <span className="font-medium text-slate-700">Assunto:</span> {message.subject}
          </p>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{message.message}</p>
          </div>
          <p className="text-xs text-slate-500">
            Recebido em {format(message.createdAt, "dd/MM/yyyy 'às' HH:mm")} · Origem:{" "}
            {message.source}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
