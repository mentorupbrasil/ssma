"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  DollarSign,
  MessageCircle,
  Pencil,
  Users,
  Calendar,
  FolderOpen,
  History,
  LayoutDashboard,
  Globe,
  Phone,
  Plus,
  Tags,
} from "lucide-react";
import type { CompanyDetailSerialized } from "@/lib/companies";
import {
  COMPANY_SIZE_LABELS,
  COMPANY_CONTRACT_LABELS,
  COMPANY_CONTACT_TYPE_LABELS,
  COMPANY_HISTORY_ACTION_LABELS,
  buildCompanyWhatsAppMessage,
} from "@/lib/companies";
import {
  DOCUMENT_TYPE_LABELS,
  normalizeDocumentStatus,
} from "@/lib/documents";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCNPJ, formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { toggleCompanyPortal } from "@/actions/companies";
import { EditCompanyDialog, CompanyContactDialog } from "./CompanyDialogs";
import { InlineEmptyNote } from "@/components/dashboard/InlineEmptyNote";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { toast } from "sonner";

const TABS = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "employees", label: "Colaboradores", icon: Users },
  { id: "referrals", label: "Encaminhamentos", icon: FileText },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "documents", label: "Documentos", icon: FolderOpen },
  { id: "quotes", label: "Orçamentos", icon: DollarSign },
  { id: "contract", label: "Contrato e preços", icon: Tags },
  { id: "contacts", label: "Contatos", icon: Phone },
  { id: "portal", label: "Portal", icon: Globe },
  { id: "history", label: "Histórico", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

type CompanyDetailClientProps = {
  company: CompanyDetailSerialized;
  canManage: boolean;
  canCommercial: boolean;
};

export function CompanyDetailClient({
  company,
  canManage,
  canCommercial,
}: CompanyDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "overview";

  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const displayName = company.tradeName ?? company.legalName;
  const phone = company.whatsapp ?? company.phone;
  const waUrl = phone
    ? `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(buildCompanyWhatsAppMessage(displayName))}`
    : null;

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard/empresas/${company.id}?${params.toString()}`);
  };

  const refresh = () => router.refresh();

  const handlePortalToggle = async () => {
    const result = await toggleCompanyPortal(company.id, !company.portalEnabled);
    if (result.success) {
      toast.success(company.portalEnabled ? "Portal desativado" : "Portal ativado");
      refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="referrals-module">
      <PageHeader title={company.legalName} description={company.tradeName ?? "Gestão da empresa"}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={company.status} type="company" />
          {canManage && (
            <>
              <Link
                href={`/dashboard/encaminhamentos/novo?companyId=${company.id}`}
                className={cn(buttonVariants({ variant: "brand", size: "sm" }))}
              >
                <FileText className="mr-1.5 h-4 w-4" /> Novo encaminhamento
              </Link>
              {canCommercial && (
                <Link
                  href={`/dashboard/orcamentos?companyId=${company.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <DollarSign className="mr-1.5 h-4 w-4" /> Novo orçamento
                </Link>
              )}
            </>
          )}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
            </a>
          )}
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Editar
            </Button>
          )}
        </div>
      </PageHeader>

      <p className="mb-4 text-sm text-slate-500">CNPJ: {formatCNPJ(company.cnpj)}</p>

      <div className="referral-status-tabs mb-6 flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "referral-status-tab",
              activeTab === tab.id && "referral-status-tab-active"
            )}
          >
            <tab.icon className="mr-1.5 inline h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab company={company} onNavigate={setTab} />
      )}
      {activeTab === "employees" && (
        <EmployeesTab company={company} canManage={canManage} />
      )}
      {activeTab === "referrals" && (
        <ReferralsTab company={company} canManage={canManage} waUrl={waUrl} />
      )}
      {activeTab === "agenda" && <AgendaTab company={company} canManage={canManage} />}
      {activeTab === "documents" && <DocumentsTab company={company} />}
      {activeTab === "quotes" && <QuotesTab company={company} canCommercial={canCommercial} />}
      {activeTab === "contract" && <ContractTab company={company} canCommercial={canCommercial} />}
      {activeTab === "contacts" && (
        <ContactsTab
          company={company}
          canManage={canManage}
          onAddContact={() => setContactOpen(true)}
        />
      )}
      {activeTab === "portal" && (
        <PortalTab
          company={company}
          canManage={canManage}
          onToggle={handlePortalToggle}
        />
      )}
      {activeTab === "history" && <HistoryTab company={company} />}

      <EditCompanyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        companyId={company.id}
        company={{
          legalName: company.legalName,
          tradeName: company.tradeName,
          cnpj: company.cnpj,
          whatsapp: company.whatsapp,
          email: company.email,
          phone: company.phone,
          responsibleName: company.responsibleName,
          notes: company.notes,
          status: company.status,
        }}
        onSuccess={refresh}
      />
      <CompanyContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        companyId={company.id}
        onSuccess={refresh}
      />
    </div>
  );
}

function OverviewTab({
  company,
  onNavigate,
}: {
  company: CompanyDetailSerialized;
  onNavigate: (tab: TabId) => void;
}) {
  const stats = [
    { label: "Colaboradores", value: company.stats.employees, tab: "employees" as TabId },
    { label: "Encaminhamentos em aberto", value: company.stats.openReferrals, tab: "referrals" as TabId },
    { label: "Agendamentos futuros", value: company.stats.upcomingAppointments, tab: "agenda" as TabId },
    { label: "Documentos pendentes", value: company.stats.pendingDocuments, tab: "documents" as TabId },
    { label: "Orçamentos pendentes", value: company.stats.pendingQuotes, tab: "quotes" as TabId },
  ];

  return (
    <div className="space-y-6">
      <div className="referral-stat-grid referral-stat-grid-5">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            className="referral-stat-card text-left"
            onClick={() => onNavigate(s.tab)}
          >
            <span className="referral-stat-count">{s.value}</span>
            <span className="referral-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <InfoRow label="Razão social" value={company.legalName} />
          <InfoRow label="Nome fantasia" value={company.tradeName ?? "—"} />
          <InfoRow label="Responsável" value={company.responsibleName ?? "—"} />
          <InfoRow label="Cargo" value={company.responsibleRole ?? "—"} />
          <InfoRow label="WhatsApp" value={company.whatsapp ? formatPhone(company.whatsapp) : "—"} />
          <InfoRow label="E-mail" value={company.email ?? "—"} />
          <InfoRow
            label="Endereço"
            value={
              [company.address, company.city, company.state, company.zipCode]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          <InfoRow label="Porte" value={company.size ? COMPANY_SIZE_LABELS[company.size] : "—"} />
          <InfoRow
            label="Contrato"
            value={company.contractType ? COMPANY_CONTRACT_LABELS[company.contractType] : "—"}
          />
          <InfoRow label="Segmento" value={company.segment ?? "—"} />
          <InfoRow
            label="Último atendimento"
            value={
              company.stats.lastAppointmentAt
                ? format(new Date(company.stats.lastAppointmentAt), "dd/MM/yyyy", { locale: ptBR })
                : "—"
            }
          />
          {company.notes && (
            <div className="sm:col-span-2">
              <InfoRow label="Observações internas" value={company.notes} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function EmployeesTab({
  company,
  canManage,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
}) {
  return (
    <div>
      {canManage && (
        <div className="mb-4 flex gap-2">
          <Link
            href={`/dashboard/colaboradores?new=1&companyId=${company.id}`}
            className={cn(buttonVariants({ variant: "brand", size: "sm" }))}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Novo colaborador
          </Link>
        </div>
      )}
      {company.employees.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum colaborador cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Último exame</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {company.employees.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <Link href={`/dashboard/colaboradores/${e.id}`} className="text-[#16A085] hover:underline">
                    {e.fullName}
                  </Link>
                </TableCell>
                <TableCell>{e.cpf}</TableCell>
                <TableCell>{e.jobTitle ?? "—"}</TableCell>
                <TableCell>{e.department ?? "—"}</TableCell>
                <TableCell>
                  {e.lastReferralAt
                    ? format(new Date(e.lastReferralAt), "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </TableCell>
                <TableCell>{e.status === "ATIVO" ? "Ativo" : e.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ReferralsTab({
  company,
  canManage,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
  waUrl?: string | null;
}) {
  if (company.referrals.length === 0) {
    return (
      <EmptyState
        compact
        title="Nenhum encaminhamento"
        description="Esta empresa ainda não possui encaminhamentos registrados."
        action={
          canManage
            ? { label: "Novo encaminhamento", href: `/dashboard/encaminhamentos/novo?companyId=${company.id}` }
            : undefined
        }
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Protocolo</TableHead>
          <TableHead>Colaborador</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Agendamento</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {company.referrals.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Link
                href={`/dashboard/encaminhamentos?id=${r.id}`}
                className="text-[#16A085] hover:underline"
              >
                {r.protocol}
              </Link>
            </TableCell>
            <TableCell>{r.employeeName}</TableCell>
            <TableCell>{CLINICAL_EXAM_LABELS[r.clinicalExamType] ?? r.clinicalExamType}</TableCell>
            <TableCell>{format(new Date(r.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
            <TableCell>
              {r.scheduledAt
                ? format(new Date(r.scheduledAt), "dd/MM HH:mm", { locale: ptBR })
                : "—"}
            </TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AgendaTab({ company, canManage }: { company: CompanyDetailSerialized; canManage: boolean }) {
  if (company.appointments.length === 0) {
    return (
      <EmptyState
        compact
        title="Nenhum agendamento"
        description="Não há agendamentos vinculados a esta empresa."
        action={
          canManage
            ? { label: "Agendar atendimento", href: `/dashboard/agenda?companyId=${company.id}` }
            : undefined
        }
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Horário</TableHead>
          <TableHead>Colaborador</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Protocolo</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {company.appointments.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              {format(new Date(a.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}
            </TableCell>
            <TableCell>
              <Link
                href={`/dashboard/agenda?id=${a.id}`}
                className="text-[#16A085] hover:underline"
              >
                {format(new Date(a.scheduledAt), "HH:mm", { locale: ptBR })}
              </Link>
            </TableCell>
            <TableCell>{a.employeeName ?? "—"}</TableCell>
            <TableCell>
              {a.clinicalExamType
                ? CLINICAL_EXAM_LABELS[a.clinicalExamType]
                : "—"}
            </TableCell>
            <TableCell>{a.protocol ?? "—"}</TableCell>
            <TableCell>
              <StatusBadge status={a.status} type="appointment" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DocumentsTab({ company }: { company: CompanyDetailSerialized }) {
  return company.documents.length === 0 ? (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Nenhum documento vinculado.</p>
      <Link
        href={`/dashboard/documentos?companyId=${company.id}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        <Plus className="mr-2 h-4 w-4" /> Anexar documento
      </Link>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href={`/dashboard/documentos?companyId=${company.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Ver na central de documentos
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Anexado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {company.documents.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                {DOCUMENT_TYPE_LABELS[d.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? d.type}
              </TableCell>
              <TableCell>
                {d.fileUrl ? (
                  <a
                    href={`/api/documents/${d.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#16A085] hover:underline"
                  >
                    {d.title}
                  </a>
                ) : (
                  d.title
                )}
              </TableCell>
              <TableCell>
                {d.validUntil
                  ? format(new Date(d.validUntil), "dd/MM/yyyy", { locale: ptBR })
                  : "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={normalizeDocumentStatus(d.status as import("@prisma/client").DocumentStatus)} type="document" />
              </TableCell>
              <TableCell>
                {format(new Date(d.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function QuotesTab({
  company,
  canCommercial,
}: {
  company: CompanyDetailSerialized;
  canCommercial: boolean;
}) {
  if (company.quotes.length === 0) {
    return (
      <EmptyState
        compact
        title="Nenhum orçamento"
        description="Orçamentos vinculados a esta empresa aparecerão aqui."
        action={
          canCommercial
            ? { label: "Novo orçamento", href: `/dashboard/orcamentos?companyId=${company.id}` }
            : undefined
        }
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Serviço</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Validade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {company.quotes.map((q) => (
          <TableRow key={q.id}>
            <TableCell>
              <Link href={`/dashboard/orcamentos?id=${q.id}`} className="text-[#16A085] hover:underline">
                {q.quoteNumber ?? q.id.slice(-6).toUpperCase()}
              </Link>
            </TableCell>
            <TableCell>{q.serviceTitle ?? "—"}</TableCell>
            <TableCell>
              {q.estimatedValue != null
                ? q.estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "—"}
            </TableCell>
            <TableCell>
              <StatusBadge status={q.status} type="quote" />
            </TableCell>
            <TableCell>
              {format(new Date(q.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            </TableCell>
            <TableCell>
              {q.validUntil
                ? format(new Date(q.validUntil), "dd/MM/yyyy", { locale: ptBR })
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ContractTab({
  company,
  canCommercial,
}: {
  company: CompanyDetailSerialized;
  canCommercial: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          <InfoRow
            label="Tipo de contrato"
            value={company.contractType ? COMPANY_CONTRACT_LABELS[company.contractType] : "Não definido"}
          />
          <InfoRow label="Status comercial" value={company.status} />
          <InfoRow label="Portal empresarial" value={company.portalEnabled ? "Ativo" : "Inativo"} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#0F3D4A]">Preços negociados</h3>
        {canCommercial && (
          <Link
            href={`/dashboard/tabela-precos?companyId=${company.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Gerenciar na tabela de preços
          </Link>
        )}
      </div>

      {company.priceListItems.length === 0 ? (
        <InlineEmptyNote>
          Nenhum preço específico para esta empresa. Os valores padrão da clínica serão aplicados.
        </InlineEmptyNote>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Cobrança</TableHead>
              <TableHead>Preço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {company.priceListItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.chargeType}</TableCell>
                <TableCell>
                  {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ContactsTab({
  company,
  canManage,
  onAddContact,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
  onAddContact: () => void;
}) {
  return (
    <div className="space-y-6">
      {canManage && (
        <Button variant="brand" size="sm" onClick={onAddContact}>
          <Plus className="mr-1.5 h-4 w-4" /> Registrar contato
        </Button>
      )}
      {company.siteMessages.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-[#0F3D4A]">Mensagens do site</h3>
          <ul className="space-y-2">
            {company.siteMessages.map((m) => (
              <li key={m.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <p className="font-medium">{m.subject}</p>
                <p className="text-slate-500">{m.name}</p>
                <StatusBadge status={m.status} type="contact" />
              </li>
            ))}
          </ul>
        </div>
      )}
      {company.contacts.length === 0 && company.siteMessages.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum contato registrado.</p>
      ) : (
        <ul className="referral-history-list">
          {company.contacts.map((c) => (
            <li key={c.id} className="referral-history-item">
              <div className="flex justify-between">
                <span className="font-medium text-sm">
                  {COMPANY_CONTACT_TYPE_LABELS[c.type as keyof typeof COMPANY_CONTACT_TYPE_LABELS] ?? c.type}
                  {c.title ? ` — ${c.title}` : ""}
                </span>
                <span className="text-xs text-slate-400">
                  {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
              {c.performedByName && (
                <p className="text-xs text-slate-500">Por: {c.performedByName}</p>
              )}
              <p className="mt-1 text-sm text-slate-600">{c.notes}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PortalTab({
  company,
  canManage,
  onToggle,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          <InfoRow label="Portal ativo" value={company.portalEnabled ? "Sim" : "Não"} />
          <InfoRow label="Usuários vinculados" value={String(company.portalUsers.length)} />
          <InfoRow
            label="E-mail de acesso RH"
            value={company.portalUsers[0]?.email ?? company.email ?? "—"}
          />
          <InfoRow label="Status do acesso" value={company.status} />
        </CardContent>
      </Card>
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button variant="brand" size="sm" onClick={onToggle}>
            {company.portalEnabled ? "Desativar portal" : "Ativar portal"}
          </Button>
          <Link
            href={`/dashboard/usuarios?companyId=${company.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Criar usuário do RH
          </Link>
        </div>
      )}
      {company.portalUsers.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {company.portalUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.status === "ACTIVE" ? "Ativo" : "Inativo"}</TableCell>
                <TableCell>
                  {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function HistoryTab({ company }: { company: CompanyDetailSerialized }) {
  return company.history.length === 0 ? (
    <p className="text-sm text-slate-500">Nenhum registro no histórico.</p>
  ) : (
    <ul className="referral-history-list">
      {company.history.map((h) => (
        <li key={h.id} className="referral-history-item">
          <div className="flex justify-between">
            <span className="font-medium text-sm">
              {COMPANY_HISTORY_ACTION_LABELS[h.action] ?? h.action}
            </span>
            <span className="text-xs text-slate-400">
              {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          </div>
          {h.performedByName && (
            <p className="text-xs text-slate-500">Por: {h.performedByName}</p>
          )}
          {h.notes && <p className="mt-1 text-sm text-slate-600">{h.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
