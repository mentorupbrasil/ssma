"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/types/roles";
import { createUser, deactivateUser, updateUser } from "@/actions/users";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  company: { tradeName: string | null; legalName: string } | null;
};

const ROLES: UserRole[] = [
  "CLINIC_ADMIN",
  "RECEPTION",
  "COMMERCIAL",
  "FINANCIAL",
  "SST_TECHNICIAN",
  "HEALTH_PROFESSIONAL",
  "COMPANY_HR",
  "READ_ONLY",
];

export function UsuariosClient({
  users,
  companies,
  defaultCompanyId,
}: {
  users: UserRow[];
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("RECEPTION");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "ALL");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      ROLE_LABELS[u.role].toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchQ && matchStatus;
  });

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = users.filter((u) => u.status === "INACTIVE").length;

  async function handleCreate() {
    const result = await createUser({ name, email, password, role, companyId: companyId || undefined });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Usuário criado");
    setOpen(false);
    resetForm();
    startTransition(() => router.refresh());
  }

  async function handleUpdate() {
    if (!editUser) return;
    const result = await updateUser({
      id: editUser.id,
      name,
      role,
      companyId: role === "COMPANY_HR" ? companyId || null : null,
      password: password || undefined,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Usuário atualizado");
    setEditUser(null);
    resetForm();
    startTransition(() => router.refresh());
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("RECEPTION");
    setCompanyId(defaultCompanyId ?? "");
  }

  function openEdit(u: UserRow) {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    setCompanyId("");
  }

  return (
    <div className="referrals-module">
      <PageHeader
        title="Usuários e permissões"
        description="Gestão de acesso ao sistema"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Novo usuário</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
              <UserForm
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                role={role} setRole={setRole}
                companyId={companyId} setCompanyId={setCompanyId}
                companies={companies}
                isEdit={false}
              />
              <Button onClick={handleCreate} disabled={pending}>Salvar</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="referral-stat-grid referral-stat-grid-3 mb-6">
        <div className="referral-stat-card">
          <span className="referral-stat-count">{users.length}</span>
          <span className="referral-stat-label">Total</span>
        </div>
        <div className="referral-stat-card">
          <span className="referral-stat-count">{activeCount}</span>
          <span className="referral-stat-label">Ativos</span>
        </div>
        <div className="referral-stat-card">
          <span className="referral-stat-count">{inactiveCount}</span>
          <span className="referral-stat-label">Inativos</span>
        </div>
      </div>

      <FilterBar className="mb-4">
        <Input
          placeholder="Buscar nome, e-mail ou perfil..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativos</SelectItem>
            <SelectItem value="INACTIVE">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum usuário encontrado"
          description={users.length === 0 ? "Cadastre o primeiro usuário da clínica." : "Ajuste os filtros de busca."}
          action={users.length === 0 ? { label: "Novo usuário", onClick: () => setOpen(true) } : undefined}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última atualização</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge></TableCell>
                  <TableCell>{u.company?.tradeName ?? u.company?.legalName ?? "—"}</TableCell>
                  <TableCell>{u.status === "ACTIVE" ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(u.updatedAt, "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {u.status === "ACTIVE" ? (
                      <Button size="sm" variant="ghost" onClick={() => startTransition(async () => {
                        await deactivateUser(u.id);
                        router.refresh();
                      })}><UserX className="h-4 w-4" /></Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => startTransition(async () => {
                        await updateUser({ id: u.id, status: "ACTIVE" });
                        router.refresh();
                      })}><UserCheck className="h-4 w-4" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
          <UserForm
            name={name} setName={setName}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            role={role} setRole={setRole}
            companyId={companyId} setCompanyId={setCompanyId}
            companies={companies}
            isEdit
          />
          <Button onClick={handleUpdate} disabled={pending}>Salvar alterações</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserForm({
  name, setName, email, setEmail, password, setPassword,
  role, setRole, companyId, setCompanyId, companies, isEdit,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  role: UserRole; setRole: (v: UserRole) => void;
  companyId: string; setCompanyId: (v: string) => void;
  companies: { id: string; name: string }[];
  isEdit: boolean;
}) {
  return (
    <div className="space-y-3">
      <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEdit} />
      <Input type="password" placeholder={isEdit ? "Nova senha (opcional)" : "Senha"} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role === "COMPANY_HR" && (
        <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
