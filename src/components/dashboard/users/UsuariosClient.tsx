"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getMetricMeta } from "@/lib/metric-cards";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import {
  SystemActionMenu,
  type SystemActionItem,
} from "@/components/dashboard/SystemActionMenu";
import {
  SystemModalField,
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  function buildUserActions(u: UserRow): SystemActionItem[] {
    const actions: SystemActionItem[] = [
      {
        label: "Editar",
        hint: "Alterar dados e perfil",
        icon: Pencil,
        iconTone: "view",
        onClick: () => openEdit(u),
      },
    ];
    if (u.status === "ACTIVE") {
      actions.push({
        label: "Desativar",
        hint: "Bloquear acesso",
        icon: UserX,
        iconTone: "cancel",
        onClick: () =>
          startTransition(async () => {
            await deactivateUser(u.id);
            router.refresh();
          }),
      });
    } else {
      actions.push({
        label: "Reativar",
        hint: "Restaurar acesso",
        icon: UserCheck,
        iconTone: "done",
        onClick: () =>
          startTransition(async () => {
            await updateUser({ id: u.id, status: "ACTIVE" });
            router.refresh();
          }),
      });
    }
    return actions;
  }

  return (
    <PageModule>
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Usuários e permissões</h1>
          <p className="colaboradores-empresa-subtitle">Gestão de acesso ao sistema</p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </Button>
        </div>
      </header>

      <MetricGrid>
        {(
          [
            { key: "total", label: "Total de usuários", value: users.length },
            { key: "active", label: "Ativos", value: activeCount },
            { key: "inactive", label: "Inativos", value: inactiveCount },
          ] as const
        ).map((item) => {
          const meta = getMetricMeta(`user:${item.key}`);
          return (
            <MetricCard
              key={item.key}
              label={item.label}
              value={item.value}
              icon={meta.icon}
              description={meta.description}
              variant={meta.tone}
            />
          );
        })}
      </MetricGrid>

      <FilterBar>
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
        <div className="colaboradores-empresa-table-wrap">
          <div className="colaboradores-empresa-table-scroll">
            <Table className="colaboradores-empresa-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead className="colaboradores-empresa-th-actions">Ações</TableHead>
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
                    <TableCell>
                      <SystemActionMenu items={buildUserActions(u)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <SystemModalShell
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
        title="Novo usuário"
        description="Cadastre um acesso ao painel da clínica."
        badges={[
          { label: "Usuários", variant: "category" },
          { label: "Novo", variant: "status" },
        ]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={handleCreate}
              disabled={pending}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <UserFormFields
          name={name} setName={setName}
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          role={role} setRole={setRole}
          companyId={companyId} setCompanyId={setCompanyId}
          companies={companies}
          isEdit={false}
        />
      </SystemModalShell>

      <SystemModalShell
        open={!!editUser}
        onOpenChange={(o) => {
          if (!o) {
            setEditUser(null);
            resetForm();
          }
        }}
        title="Editar usuário"
        description="Atualize perfil, empresa ou senha."
        badges={[
          { label: "Usuários", variant: "category" },
          { label: "Edição", variant: "status" },
        ]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => {
                setEditUser(null);
                resetForm();
              }}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={handleUpdate}
              disabled={pending}
            >
              Salvar alterações
            </Button>
          </div>
        }
      >
        <UserFormFields
          name={name} setName={setName}
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          role={role} setRole={setRole}
          companyId={companyId} setCompanyId={setCompanyId}
          companies={companies}
          isEdit
        />
      </SystemModalShell>
    </PageModule>
  );
}

function UserFormFields({
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
    <>
      <SystemModalField label="Nome" required wide>
        <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="E-mail" required wide>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isEdit}
        />
      </SystemModalField>
      <SystemModalField label={isEdit ? "Nova senha" : "Senha"} required={!isEdit} wide>
        <input
          type="password"
          placeholder={isEdit ? "Nova senha (opcional)" : "Senha"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </SystemModalField>
      <SystemModalField label="Perfil" required wide>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SystemModalField>
      {role === "COMPANY_HR" && (
        <SystemModalField label="Empresa" required wide>
          <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SystemModalField>
      )}
    </>
  );
}
