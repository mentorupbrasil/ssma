"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/types/roles";
import { createUser, deactivateUser } from "@/actions/users";
import { toast } from "sonner";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  company: { tradeName: string | null; legalName: string } | null;
};

const ROLES: UserRole[] = ["CLINIC_ADMIN", "RECEPTION", "COMMERCIAL", "FINANCIAL", "SST_TECHNICIAN", "HEALTH_PROFESSIONAL", "COMPANY_HR", "READ_ONLY"];

export function UsuariosClient({ users, companies }: { users: UserRow[]; companies: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("RECEPTION");
  const [companyId, setCompanyId] = useState("");

  async function handleCreate() {
    const result = await createUser({ name, email, password, role, companyId: companyId || undefined });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Usuário criado");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <PageHeader
        title="Usuários e permissões"
        description="Gestão de acesso ao sistema"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Novo usuário</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
                <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {role === "COMPANY_HR" && (
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={handleCreate} disabled={pending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge></TableCell>
                <TableCell>{u.company?.tradeName ?? u.company?.legalName ?? "—"}</TableCell>
                <TableCell>{u.status === "ACTIVE" ? "Ativo" : "Inativo"}</TableCell>
                <TableCell>
                  {u.status === "ACTIVE" && (
                    <Button size="sm" variant="ghost" onClick={() => startTransition(async () => {
                      await deactivateUser(u.id);
                      router.refresh();
                    })}>Desativar</Button>
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
