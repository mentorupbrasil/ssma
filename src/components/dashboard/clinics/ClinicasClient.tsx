"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClinic, updateClinic } from "@/actions/clinics";
import { toast } from "sonner";
import type { ClinicPlan, ClinicStatus } from "@prisma/client";

type ClinicRow = {
  id: string;
  name: string;
  slug: string;
  status: ClinicStatus;
  plan: ClinicPlan;
  email: string | null;
  _count: { companies: number; users: number };
};

export function ClinicasClient({ clinics }: { clinics: ClinicRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function handleCreate() {
    const result = await createClinic({ name, email });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Clínica criada");
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Clínicas"
        description="Gestão de tenants do SaaS Unimetra"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Nova clínica</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Nova clínica</DialogTitle></DialogHeader>
              <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
              <Input className="mt-3" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button className="mt-3" onClick={handleCreate}>Salvar</Button>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinics.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.plan}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell>{c._count.companies}</TableCell>
                <TableCell>{c._count.users}</TableCell>
                <TableCell>
                  {c.status !== "ATIVA" && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      await updateClinic({ id: c.id, status: "ATIVA" });
                      router.refresh();
                    }}>Ativar</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
