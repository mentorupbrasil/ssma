import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default async function DocumentosPage() {
  const documents = await prisma.document.findMany({
    include: { company: true, patient: true, referral: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Documentos" description="ASO, PCMSO, laudos e demais documentos" />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Vínculo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  Nenhum documento cadastrado. Estrutura pronta para upload em fase futura.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>{d.type}</TableCell>
                  <TableCell>
                    {d.company?.tradeName ?? d.patient?.fullName ?? d.referral?.protocol ?? "—"}
                  </TableCell>
                  <TableCell>{format(d.createdAt, "dd/MM/yyyy")}</TableCell>
                  <TableCell><StatusBadge status={d.status} type="document" /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
