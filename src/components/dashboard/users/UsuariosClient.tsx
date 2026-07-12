"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Shield,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  activateUser,
  createUser,
  deactivateUser,
  resetUserPassword,
  saveRolePermissions,
  updateUser,
} from "@/actions/users";
import {
  getVisibleEditablePermissions,
  MANAGEABLE_ROLES,
  PERMISSION_MODULE_LABELS,
  ROLE_LABELS,
  getPermissionsForRole,
  isPortalRhRole,
  type Permission,
  type RolePermissionMap,
} from "@/lib/permissions";
import type { UserRole } from "@/types/roles";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  lastAccessAt: string | null;
  updatedAt: string;
  companyId: string | null;
  company: { tradeName: string | null; legalName: string } | null;
};

type UsuariosClientProps = {
  users: UserRow[];
  companies: { id: string; name: string }[];
  rolePermissions: RolePermissionMap;
  defaultCompanyId?: string;
  filters: {
    tab?: string;
    q?: string;
    role?: string;
    status?: string;
    companyId?: string;
    page?: string;
  };
};

const PAGE_SIZE = 25;

type ModalMode = "create" | "edit" | "role" | "password" | null;

export function UsuariosClient({
  users,
  companies,
  rolePermissions,
  defaultCompanyId,
  filters,
}: UsuariosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const tab = filters.tab === "perfis" ? "perfis" : "usuarios";
  const [q, setQ] = useState(filters.q ?? "");
  const [roleFilter, setRoleFilter] = useState(filters.role ?? "");
  const [statusFilter, setStatusFilter] = useState(filters.status ?? "");
  const [companyFilter, setCompanyFilter] = useState(filters.companyId ?? "");
  const page = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);

  const [mode, setMode] = useState<ModalMode>(null);
  const [active, setActive] = useState<UserRow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("RECEPTION");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");

  const [matrix, setMatrix] = useState<RolePermissionMap>(rolePermissions);
  const [selectedProfile, setSelectedProfile] = useState<UserRole>(MANAGEABLE_ROLES[0]);

  useEffect(() => {
    setMatrix(rolePermissions);
  }, [rolePermissions]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    startTransition(() => router.push(`/dashboard/usuarios?${params.toString()}`));
  };

  const filtered = useMemo(() => {
    const query = (filters.q ?? q).trim().toLowerCase();
    return users.filter((u) => {
      const matchQ =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchStatus = !statusFilter || u.status === statusFilter;
      const matchCompany = !companyFilter || u.companyId === companyFilter;
      return matchQ && matchRole && matchStatus && matchCompany;
    });
  }, [users, filters.q, q, roleFilter, statusFilter, companyFilter]);

  const activeCount = filtered.filter((u) => u.status === "ACTIVE").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const profilePerms = matrix[selectedProfile] ?? getPermissionsForRole(selectedProfile, matrix);

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("RECEPTION");
    setStatus("ACTIVE");
    setCompanyId(defaultCompanyId ?? "");
    setActive(null);
    setMode(null);
  }

  function openCreate() {
    resetForm();
    setMode("create");
  }

  function openEdit(u: UserRow, nextMode: ModalMode = "edit") {
    setActive(u);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    setStatus(u.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    setCompanyId(u.companyId ?? "");
    setMode(nextMode);
  }

  async function handleSaveUser() {
    if (mode === "create") {
      const result = await createUser({
        name,
        email,
        password,
        role,
        status,
        companyId: isPortalRhRole(role) ? companyId || undefined : undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Usuário criado.");
    } else if (active && (mode === "edit" || mode === "role")) {
      const result = await updateUser({
        id: active.id,
        name,
        role,
        status,
        companyId: isPortalRhRole(role) ? companyId || null : null,
        password: password || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Usuário atualizado.");
    } else if (active && mode === "password") {
      const result = await resetUserPassword({ id: active.id, password });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Senha redefinida. Informe o novo acesso ao usuário.");
    }
    resetForm();
    startTransition(() => router.refresh());
  }

  function buildActions(u: UserRow): SystemActionItem[] {
    const actions: SystemActionItem[] = [
      {
        label: "Editar usuário",
        hint: "Nome, e-mail, status e vínculo",
        icon: Pencil,
        iconTone: "view",
        onClick: () => openEdit(u, "edit"),
      },
      {
        label: "Alterar perfil e permissões",
        hint: "Trocar perfil do usuário",
        icon: Shield,
        iconTone: "docs",
        onClick: () => openEdit(u, "role"),
      },
      {
        label: "Redefinir senha ou reenviar acesso",
        hint: "Definir nova senha temporária",
        icon: KeyRound,
        iconTone: "schedule",
        onClick: () => openEdit(u, "password"),
      },
    ];
    if (u.status === "ACTIVE") {
      actions.push({
        label: "Desativar",
        hint: "Bloquear acesso ao sistema",
        icon: UserX,
        iconTone: "cancel",
        onClick: () =>
          startTransition(async () => {
            const result = await deactivateUser(u.id);
            if (!result.success) toast.error(result.error);
            else toast.success("Usuário desativado.");
            router.refresh();
          }),
      });
    } else {
      actions.push({
        label: "Ativar",
        hint: "Restaurar acesso",
        icon: UserCheck,
        iconTone: "done",
        onClick: () =>
          startTransition(async () => {
            const result = await activateUser(u.id);
            if (!result.success) toast.error(result.error);
            else toast.success("Usuário ativado.");
            router.refresh();
          }),
      });
    }
    return actions;
  }

  function togglePermission(perm: Permission) {
    const current = new Set(profilePerms);
    if (current.has(perm)) current.delete(perm);
    else current.add(perm);
    setMatrix((prev) => ({
      ...prev,
      [selectedProfile]: Array.from(current),
    }));
  }

  async function handleSaveProfile() {
    const result = await saveRolePermissions(selectedProfile, profilePerms);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Permissões do perfil salvas.");
    startTransition(() => router.refresh());
  }

  const modalTitle =
    mode === "create"
      ? "Novo usuário"
      : mode === "role"
        ? "Alterar perfil e permissões"
        : mode === "password"
          ? "Redefinir senha"
          : "Editar usuário";

  const showCompanyField = isPortalRhRole(role);

  return (
    <PageModule className="usuarios-permissoes">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Usuários e permissões</h1>
          <p className="colaboradores-empresa-subtitle">
            Gerencie acessos, perfis e permissões do sistema.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          {tab === "usuarios" && (
            <Button variant="brand" size="sm" className="rounded-lg" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo usuário
            </Button>
          )}
        </div>
      </header>

      <div className="dash-module-tabs mb-4" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "usuarios"}
          className={cn("dash-module-tab", tab === "usuarios" && "dash-module-tab-active")}
          onClick={() => setFilter("tab", "")}
        >
          <Users className="h-3.5 w-3.5" />
          Usuários
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "perfis"}
          className={cn("dash-module-tab", tab === "perfis" && "dash-module-tab-active")}
          onClick={() => setFilter("tab", "perfis")}
        >
          <UserCog className="h-3.5 w-3.5" />
          Perfis e permissões
        </button>
      </div>

      {tab === "usuarios" ? (
        <>
          <div className="tabela-precos-filters usuarios-filters">
            <div className="tabela-precos-search">
              <Search className="tabela-precos-search-icon" aria-hidden />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setFilter("q", q.trim());
                }}
                onBlur={() => {
                  if ((filters.q ?? "") !== q.trim()) setFilter("q", q.trim());
                }}
                placeholder="Buscar por nome ou e-mail"
                className="tabela-precos-search-input"
              />
            </div>
            <select
              className="tabela-precos-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setFilter("role", e.target.value);
              }}
              aria-label="Perfil"
            >
              <option value="">Perfil</option>
              {MANAGEABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select
              className="tabela-precos-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setFilter("status", e.target.value);
              }}
              aria-label="Status"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
            </select>
            <select
              className="tabela-precos-select"
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setFilter("companyId", e.target.value);
              }}
              aria-label="Empresa"
            >
              <option value="">Empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <p className="usuarios-result-meta">
            {filtered.length} usuário{filtered.length === 1 ? "" : "s"} cadastrado
            {filtered.length === 1 ? "" : "s"} · {activeCount} ativo
            {activeCount === 1 ? "" : "s"}
          </p>

          {pageItems.length === 0 ? (
            <EmptyState
              icon={Users}
              compact
              title="Nenhum usuário encontrado"
              description={
                users.length === 0
                  ? "Cadastre o primeiro usuário da clínica."
                  : "Ajuste os filtros de busca."
              }
              action={
                users.length === 0
                  ? { label: "Novo usuário", onClick: openCreate }
                  : undefined
              }
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
                      <TableHead>Empresa/Escopo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último acesso</TableHead>
                      <TableHead className="colaboradores-empresa-th-actions">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((u) => {
                      const portal = isPortalRhRole(u.role);
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-medium text-[var(--brand-navy)]">{u.name}</div>
                            <div className="text-xs text-[var(--dash-text-muted)]">
                              {portal ? "Portal RH" : "Unimetra (interno)"}
                            </div>
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <span className="usuarios-role-badge">{ROLE_LABELS[u.role]}</span>
                          </TableCell>
                          <TableCell>
                            {portal
                              ? u.company?.tradeName ?? u.company?.legalName ?? "Empresa não vinculada"
                              : "Clínica Unimetra"}
                          </TableCell>
                          <TableCell>{u.status === "ACTIVE" ? "Ativo" : "Inativo"}</TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {u.lastAccessAt
                              ? format(new Date(u.lastAccessAt), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })
                              : "Nunca"}
                          </TableCell>
                          <TableCell>
                            <SystemActionMenu items={buildActions(u)} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="colaboradores-empresa-pagination">
                  <span>
                    Página {pageSafe} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pageSafe <= 1 || pending}
                      onClick={() => setFilter("page", String(pageSafe - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pageSafe >= totalPages || pending}
                      onClick={() => setFilter("page", String(pageSafe + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="usuarios-perfis-layout">
          <aside className="usuarios-perfis-list">
            {MANAGEABLE_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                className={cn(
                  "usuarios-perfil-item",
                  selectedProfile === r && "usuarios-perfil-item-active"
                )}
                onClick={() => setSelectedProfile(r)}
              >
                <span>{ROLE_LABELS[r]}</span>
                <span className="usuarios-perfil-scope">
                  {isPortalRhRole(r) ? "Portal RH" : "Interno"}
                </span>
              </button>
            ))}
          </aside>
          <section className="usuarios-perfis-modules">
            <header className="usuarios-perfis-head">
              <div>
                <h2>{ROLE_LABELS[selectedProfile]}</h2>
                <p>
                  Módulos que este perfil pode acessar. As alterações usam a mesma autorização do
                  sistema.
                </p>
              </div>
              <Button variant="brand" size="sm" onClick={() => void handleSaveProfile()} disabled={pending}>
                Salvar perfil
              </Button>
            </header>
            <div className="usuarios-perm-grid">
              {getVisibleEditablePermissions().map((perm) => {
                const checked = profilePerms.includes(perm);
                return (
                  <label key={perm} className="usuarios-perm-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm)}
                    />
                    <span>{PERMISSION_MODULE_LABELS[perm]}</span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <SystemModalShell
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
        title={modalTitle}
        description={
          mode === "password"
            ? "Defina uma nova senha e compartilhe com o usuário de forma segura."
            : showCompanyField
              ? "Usuário do Portal RH — acesso restrito à empresa vinculada."
              : "Usuário interno da Unimetra."
        }
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={resetForm} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleSaveUser()}
              disabled={pending}
            >
              Salvar
            </Button>
          </div>
        }
      >
        {mode === "password" ? (
          <SystemModalField label="Nova senha" required wide>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </SystemModalField>
        ) : (
          <>
            {mode !== "role" && (
              <>
                <SystemModalField label="Nome" required wide>
                  <input value={name} onChange={(e) => setName(e.target.value)} />
                </SystemModalField>
                <SystemModalField label="E-mail" required wide>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={mode === "edit"}
                  />
                </SystemModalField>
              </>
            )}
            {(mode === "create" || mode === "edit" || mode === "role") && (
              <SystemModalField label="Perfil" required wide>
                <select
                  className="tabela-precos-select w-full"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  {MANAGEABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                      {isPortalRhRole(r) ? " · Portal RH" : " · Interno"}
                    </option>
                  ))}
                </select>
              </SystemModalField>
            )}
            {showCompanyField && (
              <SystemModalField label="Empresa vinculada" required wide>
                <select
                  className="tabela-precos-select w-full"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  <option value="">Selecionar empresa</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </SystemModalField>
            )}
            {(mode === "create" || mode === "edit") && (
              <SystemModalField label="Status" wide>
                <select
                  className="tabela-precos-select w-full"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </SystemModalField>
            )}
            {(mode === "create" || mode === "edit") && (
              <SystemModalField
                label={mode === "create" ? "Senha" : "Nova senha (opcional)"}
                required={mode === "create"}
                wide
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "create" ? "Senha inicial" : "Deixe em branco para manter"}
                />
              </SystemModalField>
            )}
            {(mode === "create" || mode === "edit" || mode === "role") && (
              <div className="usuarios-perm-preview">
                <p className="usuarios-perm-preview-title">Permissões deste perfil</p>
                <ul>
                  {getPermissionsForRole(role, matrix)
                    .filter((p) => p !== "superadmin.access")
                    .map((p) => (
                      <li key={p}>
                        {PERMISSION_MODULE_LABELS[p as keyof typeof PERMISSION_MODULE_LABELS] ?? p}
                      </li>
                    ))}
                </ul>
                <p className="usuarios-perm-preview-hint">
                  Para alterar os módulos do perfil, use a aba Perfis e permissões.
                </p>
              </div>
            )}
          </>
        )}
      </SystemModalShell>
    </PageModule>
  );
}
