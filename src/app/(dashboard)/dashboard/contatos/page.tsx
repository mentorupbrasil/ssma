import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable } from "@/components/dashboard/DataTable";
import { ContactMessageStatusForm } from "@/components/dashboard/ContactMessageStatusForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhone } from "@/lib/helpers";

export default async function ContatosPage() {
  await requirePagePermission("leads.manage");

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Mensagens de contato"
        description="Formulário público do site — orçamentos, dúvidas e solicitações"
      />

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
                  Nenhuma mensagem recebida ainda.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/contatos/${m.id}`}
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
    </div>
  );
}
