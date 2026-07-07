import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EXAM_CATEGORY_LABELS } from "@/types";

export default async function ExamesDashboardPage() {
  const exams = await prisma.exam.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Exames" description="Catálogo de exames, preparos e prazos" />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preparo</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>{EXAM_CATEGORY_LABELS[e.category]}</TableCell>
                <TableCell className="max-w-xs truncate">{e.preparation}</TableCell>
                <TableCell>{e.deliveryTime}</TableCell>
                <TableCell>
                  <Badge variant={e.active ? "default" : "secondary"} className={e.active ? "bg-[#16A085]" : ""}>
                    {e.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
