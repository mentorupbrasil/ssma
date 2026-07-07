import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { LeadStatusForm } from "@/components/dashboard/LeadStatusForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function OrcamentosPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Orçamentos e Leads" description="Solicitações do site e contatos comerciais" />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
                    <p className="text-xs text-slate-500">{l.email} — {l.phone}</p>
                  </div>
                </TableCell>
                <TableCell>{l.companyName ?? "—"}</TableCell>
                <TableCell>{l.type}</TableCell>
                <TableCell>{format(l.createdAt, "dd/MM/yyyy")}</TableCell>
                <TableCell><StatusBadge status={l.status} type="lead" /></TableCell>
                <TableCell><LeadStatusForm leadId={l.id} currentStatus={l.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
