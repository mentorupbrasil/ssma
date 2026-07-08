import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { LeadStatusForm } from "@/components/dashboard/LeadStatusForm";
import { ContactMessageStatusForm } from "@/components/dashboard/ContactMessageStatusForm";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhone } from "@/lib/helpers";

export default async function OrcamentosPage() {
  await requirePagePermission("leads.manage");

  const [messages, leads] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Orçamentos e contatos"
        description="Mensagens do site, solicitações comerciais e leads"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0F3D4A]">Mensagens de contato</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                      Nenhuma mensagem recebida pelo formulário de contato.
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/orcamentos/mensagens/${m.id}`}
                          className="font-semibold text-[var(--brand-green)] hover:underline"
                        >
                          {m.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{m.subject}</TableCell>
                      <TableCell>{formatPhone(m.phone)}</TableCell>
                      <TableCell>{m.company ?? "—"}</TableCell>
                      <TableCell>{format(m.createdAt, "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>
                        <ContactMessageStatusForm messageId={m.id} currentStatus={m.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTable>
        </CardContent>
      </Card>

      {leads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F3D4A]">Leads anteriores</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <div className="rounded-xl border-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{l.name}</p>
                          <p className="text-xs text-slate-500">
                            {l.email} — {l.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{l.companyName ?? "—"}</TableCell>
                      <TableCell>{l.type}</TableCell>
                      <TableCell>{format(l.createdAt, "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <StatusBadge status={l.status} type="lead" />
                      </TableCell>
                      <TableCell>
                        <LeadStatusForm leadId={l.id} currentStatus={l.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
