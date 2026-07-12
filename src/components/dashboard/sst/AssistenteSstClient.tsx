"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FileStack,
  FileText,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import {
  SystemActionMenu,
  type SystemActionItem,
} from "@/components/dashboard/SystemActionMenu";
import {
  SystemModalField,
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addSstDraftComment,
  approveSstDraft,
  archiveSstDraft,
  createSstDraft,
  duplicateSstDraft,
  finalizeSstDraft,
  getCompanySstContext,
  getSstDraftDetail,
  returnSstDraftForCorrection,
  sendSstDraftForReview,
  updateSstDraftContent,
} from "@/actions/sst";
import {
  SST_DOCUMENT_MODELS,
  SST_KIND_LABELS,
  SST_STAGE_LABELS,
  buildAssistedSstText,
  buildSstChecklist,
  getSstModel,
  isTechnicalSstKind,
  type CompanySstContext,
  type SstChecklistItem,
  type SstContentMap,
} from "@/lib/sst-assistant";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SstDocKind } from "@prisma/client";

type DraftItem = {
  id: string;
  title: string;
  kind: SstDocKind;
  stage: string;
  complexity: string;
  version: number;
  companyId: string;
  companyName: string;
  responsibleName: string | null;
  responsibleId: string | null;
  createdByName: string;
  updatedAt: string;
  approvedAt: string | null;
};

type UserOption = { id: string; name: string };
type CompanyOption = { id: string; name: string };

type AssistenteSstClientProps = {
  items: DraftItem[];
  total: number;
  page: number;
  pageSize: number;
  companies: CompanyOption[];
  users: UserOption[];
  filters: { tab?: string; q?: string; companyId?: string };
};

const TABS = [
  { id: "elaboracao", label: "Em elaboração" },
  { id: "revisao", label: "Aguardando revisão" },
  { id: "aprovados", label: "Aprovados" },
  { id: "modelos", label: "Modelos" },
] as const;

type Detail = NonNullable<Awaited<ReturnType<typeof getSstDraftDetail>>>;

export function AssistenteSstClient({
  items,
  total,
  page,
  pageSize,
  companies,
  users,
  filters,
}: AssistenteSstClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const tab = filters.tab && TABS.some((t) => t.id === filters.tab) ? filters.tab : "elaboracao";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wCompanyId, setWCompanyId] = useState("");
  const [wKind, setWKind] = useState<SstDocKind>("ORDEM_SERVICO");
  const [wResponsibleId, setWResponsibleId] = useState("");
  const [wImportDocId, setWImportDocId] = useState("");
  const [wContext, setWContext] = useState<CompanySstContext | null>(null);
  const [wChecklist, setWChecklist] = useState<SstChecklistItem[]>([]);
  const [wLoading, setWLoading] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [content, setContent] = useState<SstContentMap>({});
  const [attachments, setAttachments] = useState<{ name: string; url: string; notes?: string }[]>([]);
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("");
  const [comment, setComment] = useState("");
  const [returnComment, setReturnComment] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [previewPage, setPreviewPage] = useState(0);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    startTransition(() => router.push(`/dashboard/assistente-sst?${params.toString()}`));
  };

  const goPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    startTransition(() => router.push(`/dashboard/assistente-sst?${params.toString()}`));
  };

  const loadDetail = useCallback(async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    const result = await getSstDraftDetail(id);
    setDetail(result);
    if (result) {
      setContent(result.content);
      setAttachments(result.attachments);
      setValidUntil(result.validUntil ? result.validUntil.slice(0, 10) : "");
      setPreviewPage(0);
    }
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) void loadDetail(id);
  }, [searchParams, loadDetail]);

  useEffect(() => {
    if (!wizardOpen || wizardStep < 2 || !wCompanyId) return;
    let cancelled = false;
    setWLoading(true);
    void getCompanySstContext(wCompanyId).then((ctx) => {
      if (cancelled) return;
      setWContext(ctx);
      if (ctx) {
        setWChecklist(buildSstChecklist(ctx, wKind, Boolean(wResponsibleId)));
      } else {
        setWChecklist([]);
      }
      setWLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [wizardOpen, wizardStep, wCompanyId, wKind, wResponsibleId]);

  const livePreview = useMemo(() => {
    if (!detail) return "";
    return buildAssistedSstText({
      kind: detail.kind,
      companyName: detail.company.name,
      cnpj: detail.company.cnpj,
      segment: detail.company.segment,
      responsibleName: detail.technicalResponsible?.name,
      content,
      checklist: Array.isArray(detail.checklist) ? detail.checklist : [],
      version: detail.version,
    });
  }, [detail, content]);

  const previewPages = useMemo(() => {
    const source = livePreview || detail?.preview || "";
    if (!source) return [""];
    const chunks: string[] = [];
    const lines = source.split("\n");
    let buf: string[] = [];
    for (const line of lines) {
      buf.push(line);
      if (buf.length >= 28) {
        chunks.push(buf.join("\n"));
        buf = [];
      }
    }
    if (buf.length) chunks.push(buf.join("\n"));
    return chunks.length ? chunks : [""];
  }, [livePreview, detail?.preview]);

  function openWizard() {
    setWizardOpen(true);
    setWizardStep(1);
    setWCompanyId("");
    setWKind("ORDEM_SERVICO");
    setWResponsibleId("");
    setWImportDocId("");
    setWContext(null);
    setWChecklist([]);
  }

  async function handleCreateDraft() {
    if (!wCompanyId) {
      toast.error("Selecione a empresa.");
      return;
    }
    if (isTechnicalSstKind(wKind) && !wResponsibleId) {
      toast.error("Documentos técnicos exigem responsável técnico.");
      return;
    }
    const result = await createSstDraft({
      companyId: wCompanyId,
      kind: wKind,
      technicalResponsibleUserId: wResponsibleId || undefined,
      importDocumentId: wImportDocId || undefined,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Rascunho criado.");
    setWizardOpen(false);
    await loadDetail(result.id);
    startTransition(() =>
      router.push(`/dashboard/assistente-sst?tab=elaboracao&id=${result.id}`)
    );
  }

  async function handleSaveDraft(bump = false) {
    if (!detailId) return;
    const result = await updateSstDraftContent({
      id: detailId,
      content,
      attachments,
      validUntil: validUntil || null,
      bumpVersion: bump,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(bump ? "Nova versão salva." : "Rascunho salvo.");
    await loadDetail(detailId);
    startTransition(() => router.refresh());
  }

  function rowActions(item: DraftItem): SystemActionItem[] {
    const elaborating = item.stage === "RASCUNHO" || item.stage === "EM_ELABORACAO";
    const reviewing = item.stage === "AGUARDANDO_REVISAO";
    const approved = item.stage === "APROVADO";
    return [
      {
        label: "Continuar elaboração",
        hint: "Abrir formulário do documento",
        icon: FileText,
        iconTone: "docs",
        onClick: () => void loadDetail(item.id),
        disabled: approved || pending,
      },
      {
        label: "Visualizar",
        hint: "Prévia e histórico",
        icon: Eye,
        iconTone: "view",
        onClick: () => void loadDetail(item.id),
      },
      {
        label: "Enviar para revisão",
        hint: "Encaminhar ao responsável técnico",
        icon: Send,
        iconTone: "schedule",
        onClick: () =>
          startTransition(async () => {
            const result = await sendSstDraftForReview(item.id);
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            toast.success("Enviado para revisão.");
            router.refresh();
          }),
        disabled: !elaborating || pending,
      },
      {
        label: "Duplicar",
        hint: "Novo rascunho a partir deste",
        icon: Copy,
        iconTone: "quote",
        onClick: () =>
          startTransition(async () => {
            const result = await duplicateSstDraft(item.id);
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            toast.success("Documento duplicado.");
            router.push(`/dashboard/assistente-sst?tab=elaboracao&id=${result.id}`);
            router.refresh();
          }),
        disabled: pending,
      },
      {
        label: "Arquivar",
        hint: "Remover da lista ativa",
        icon: Archive,
        iconTone: "cancel",
        onClick: () =>
          startTransition(async () => {
            const result = await archiveSstDraft(item.id);
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            toast.success("Arquivado.");
            router.refresh();
          }),
        disabled: pending || reviewing,
      },
    ];
  }

  const model = detail ? getSstModel(detail.kind) : null;
  const checklistStatusClass = (status: SstChecklistItem["status"]) => {
    if (status === "ok") return "sst-check-ok";
    if (status === "missing") return "sst-check-missing";
    if (status === "pending_eval" || status === "required_doc") return "sst-check-pending";
    return "sst-check-incomplete";
  };

  return (
    <PageModule className="assistente-sst">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Assistente SST</h1>
          <p className="colaboradores-empresa-subtitle">
            Elabore, revise e controle documentos de saúde e segurança do trabalho.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={openWizard}>
            <Plus className="mr-2 h-4 w-4" />
            Novo documento
          </Button>
        </div>
      </header>

      <div className="dash-module-tabs mb-4" role="tablist" aria-label="Etapas do Assistente SST">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={cn("dash-module-tab", tab === t.id && "dash-module-tab-active")}
            onClick={() => setFilter("tab", t.id === "elaboracao" ? "" : t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "modelos" ? (
        <div className="sst-models-grid">
          {SST_DOCUMENT_MODELS.map((m) => (
            <div key={m.kind} className="sst-model-row">
              <div>
                <p className="sst-model-title">{m.label}</p>
                <p className="sst-model-desc">{m.description}</p>
              </div>
              <div className="sst-model-meta">
                <span className={cn("sst-complexity", m.complexity === "TECNICO" && "sst-complexity-tech")}>
                  {m.complexity === "TECNICO" ? "Documento técnico" : "Documento simplificado"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setWizardOpen(true);
                    setWizardStep(1);
                    setWCompanyId("");
                    setWKind(m.kind);
                    setWResponsibleId("");
                    setWImportDocId("");
                    setWContext(null);
                    setWChecklist([]);
                  }}
                >
                  Usar modelo
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileStack}
          compact
          title="Nenhum documento nesta etapa"
          description="Crie um novo documento a partir dos dados já cadastrados da empresa."
          action={{ label: "Novo documento", onClick: openWizard }}
        />
      ) : (
        <div className="colaboradores-empresa-table-wrap relative">
          {pending && <LoadingState overlay label="Atualizando…" />}
          <div className="colaboradores-empresa-table-scroll">
            <Table className="colaboradores-empresa-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Responsável técnico</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium text-[var(--brand-navy)] hover:underline"
                        onClick={() => void loadDetail(item.id)}
                      >
                        {item.title}
                      </button>
                      <p className="text-xs text-[var(--dash-text-muted)]">
                        {SST_KIND_LABELS[item.kind]} · v{item.version}
                      </p>
                    </TableCell>
                    <TableCell>{item.companyName}</TableCell>
                    <TableCell>{item.responsibleName ?? "—"}</TableCell>
                    <TableCell>
                      {format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={item.stage}
                        label={
                          SST_STAGE_LABELS[item.stage as keyof typeof SST_STAGE_LABELS] ?? item.stage
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <SystemActionMenu items={rowActions(item)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="colaboradores-empresa-pagination">
              <span>
                Página {page} de {totalPages} · {total} documento(s)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || pending}
                  onClick={() => goPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || pending}
                  onClick={() => goPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <SystemModalShell
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        title="Novo documento SST"
        description="Fluxo guiado com dados reais da empresa e revisão profissional obrigatória."
        className="sst-wizard-modal"
        footer={
          <>
            <Button variant="outline" onClick={() => (wizardStep > 1 ? setWizardStep((s) => s - 1) : setWizardOpen(false))}>
              {wizardStep > 1 ? "Voltar" : "Cancelar"}
            </Button>
            {wizardStep < 4 ? (
              <Button
                variant="brand"
                disabled={wizardStep === 1 && (!wCompanyId || !wKind)}
                onClick={() => setWizardStep((s) => s + 1)}
              >
                Continuar
              </Button>
            ) : (
              <Button variant="brand" onClick={() => void handleCreateDraft()} disabled={wLoading}>
                Criar rascunho
              </Button>
            )}
          </>
        }
      >
        <div className="sst-wizard-steps">
          {[1, 2, 3, 4].map((s) => (
            <span key={s} className={cn("sst-wizard-step", wizardStep === s && "sst-wizard-step-active")}>
              Etapa {s}
            </span>
          ))}
        </div>

        {wizardStep === 1 && (
          <div className="space-y-4">
            <SystemModalField label="Empresa">
              <select
                className="tabela-precos-select w-full"
                value={wCompanyId}
                onChange={(e) => setWCompanyId(e.target.value)}
              >
                <option value="">Selecionar empresa</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </SystemModalField>
            <SystemModalField label="Tipo de documento">
              <select
                className="tabela-precos-select w-full"
                value={wKind}
                onChange={(e) => setWKind(e.target.value as SstDocKind)}
              >
                {SST_DOCUMENT_MODELS.map((m) => (
                  <option key={m.kind} value={m.kind}>
                    {m.label} ({m.complexity === "TECNICO" ? "técnico" : "simplificado"})
                  </option>
                ))}
              </select>
            </SystemModalField>
            <SystemModalField label="Responsável técnico">
              <select
                className="tabela-precos-select w-full"
                value={wResponsibleId}
                onChange={(e) => setWResponsibleId(e.target.value)}
              >
                <option value="">Selecionar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </SystemModalField>
            {isTechnicalSstKind(wKind) && (
              <p className="text-xs text-amber-700">
                Documentos técnicos exigem responsável habilitado e não podem ser finalizados sem aprovação.
              </p>
            )}
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-3">
            {wLoading && <LoadingState label="Carregando dados da empresa…" />}
            {!wLoading && wContext && (
              <>
                <p className="text-sm text-[var(--dash-text-muted)]">
                  Dados já cadastrados — não será solicitado novamente o que o sistema já possui.
                </p>
                <ul className="sst-data-list">
                  <li>
                    <strong>Empresa:</strong> {wContext.companyName} · {wContext.cnpj}
                  </li>
                  <li>
                    <strong>CNAE/segmento:</strong> {wContext.segment || "Não cadastrado"}
                  </li>
                  <li>
                    <strong>Unidade:</strong>{" "}
                    {[wContext.address, wContext.city, wContext.state].filter(Boolean).join(" · ") ||
                      "Não informada"}
                  </li>
                  <li>
                    <strong>Setores:</strong>{" "}
                    {wContext.departments.length
                      ? wContext.departments.join(", ")
                      : "Nenhum (a partir de colaboradores)"}
                  </li>
                  <li>
                    <strong>Funções:</strong>{" "}
                    {wContext.jobTitles.length ? wContext.jobTitles.join(", ") : "Nenhuma"}
                  </li>
                  <li>
                    <strong>Colaboradores:</strong> {wContext.employeeCount}
                  </li>
                  <li>
                    <strong>Exames vinculados:</strong>{" "}
                    {wContext.linkedExamTitles.length
                      ? wContext.linkedExamTitles.join(", ")
                      : "Nenhum"}
                  </li>
                  <li>
                    <strong>Documentos anteriores:</strong> {wContext.priorDocuments.length}
                  </li>
                </ul>
                {wContext.priorDocuments.length > 0 && (
                  <SystemModalField label="Importar documento anterior (opcional)">
                    <select
                      className="tabela-precos-select w-full"
                      value={wImportDocId}
                      onChange={(e) => setWImportDocId(e.target.value)}
                    >
                      <option value="">Não importar</option>
                      {wContext.priorDocuments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} ({d.type})
                        </option>
                      ))}
                    </select>
                  </SystemModalField>
                )}
              </>
            )}
            {!wLoading && !wContext && (
              <p className="text-sm text-red-600">Não foi possível carregar a empresa.</p>
            )}
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--dash-text-muted)]">
              Verificação de dados disponíveis, incompletos e avaliações pendentes.
            </p>
            <ul className="sst-checklist">
              {wChecklist.map((item) => (
                <li key={item.key} className={checklistStatusClass(item.status)}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {wizardStep === 4 && (
          <div className="space-y-3 text-sm">
            <p>
              Será criado um <strong>rascunho</strong> de{" "}
              <strong>{SST_KIND_LABELS[wKind]}</strong> para{" "}
              <strong>{wContext?.companyName ?? "empresa"}</strong>.
            </p>
            <p className="text-[var(--dash-text-muted)]">
              O formulário específico do tipo será aberto em seguida. A plataforma não inventa riscos,
              medições ou conclusões — campos sem dados aparecem como pendência.
            </p>
            {isTechnicalSstKind(wKind) && (
              <p className="flex items-start gap-2 text-amber-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Documento técnico: exige anexos/avaliações e aprovação do responsável antes da
                finalização e gravação em Documentos.
              </p>
            )}
          </div>
        )}
      </SystemModalShell>

      <DetailDrawer
        open={!!detailId}
        size="xl"
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
            setDetail(null);
            const params = new URLSearchParams(searchParams.toString());
            params.delete("id");
            startTransition(() => router.push(`/dashboard/assistente-sst?${params.toString()}`));
          }
        }}
        title={detail?.title ?? "Documento SST"}
        description={
          detail
            ? `${SST_KIND_LABELS[detail.kind]} · ${SST_STAGE_LABELS[detail.stage]} · v${detail.version}`
            : undefined
        }
      >
        {detailLoading && <LoadingState label="Carregando…" />}
        {!detailLoading && detail && model && (
          <div className="space-y-6">
            <section className="sst-detail-meta">
              <div>
                <span>Empresa</span>
                <strong>
                  {detail.company.name} · {detail.company.cnpj}
                </strong>
              </div>
              <div>
                <span>Responsável técnico</span>
                <strong>{detail.technicalResponsible?.name ?? "Não definido"}</strong>
              </div>
              <div>
                <span>Criado por</span>
                <strong>{detail.createdBy.name}</strong>
              </div>
              <div>
                <span>Revisado / aprovado</span>
                <strong>
                  {[detail.reviewedBy?.name, detail.approvedBy?.name].filter(Boolean).join(" → ") ||
                    "—"}
                </strong>
              </div>
            </section>

            {(detail.stage === "RASCUNHO" || detail.stage === "EM_ELABORACAO") && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--brand-navy)]">Elaboração</h3>
                {model.fields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs font-medium text-[var(--dash-text-muted)]">
                      {field.label}
                      {field.required ? " *" : ""}
                    </label>
                    {field.multiline ? (
                      <Textarea
                        rows={3}
                        value={content[field.key] ?? ""}
                        onChange={(e) =>
                          setContent((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.hint ?? "Preencha somente com dados verificados."}
                      />
                    ) : (
                      <Input
                        value={content[field.key] ?? ""}
                        onChange={(e) =>
                          setContent((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}

                <div className="rounded-lg border border-[var(--dash-border)] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dash-text-muted)]">
                    Anexos (medições, laudos, evidências)
                  </p>
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Nome do anexo"
                      value={attachName}
                      onChange={(e) => setAttachName(e.target.value)}
                    />
                    <Input
                      placeholder="URL / caminho do arquivo"
                      value={attachUrl}
                      onChange={(e) => setAttachUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!attachName.trim() || !attachUrl.trim()) return;
                        setAttachments((prev) => [
                          ...prev,
                          { name: attachName.trim(), url: attachUrl.trim() },
                        ]);
                        setAttachName("");
                        setAttachUrl("");
                      }}
                    >
                      Anexar
                    </Button>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {attachments.map((a, idx) => (
                      <li key={`${a.url}-${idx}`} className="flex justify-between gap-2">
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-[var(--brand-green)] underline">
                          {a.name}
                        </a>
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                    {attachments.length === 0 && (
                      <li className="text-xs text-[var(--dash-text-muted)]">Nenhum anexo.</li>
                    )}
                  </ul>
                </div>

                <SystemModalField label="Validade (para tarefa de revisão futura)">
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </SystemModalField>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void handleSaveDraft(false)}>
                    Salvar rascunho
                  </Button>
                  <Button variant="outline" onClick={() => void handleSaveDraft(true)}>
                    Salvar nova versão
                  </Button>
                  <Button
                    variant="brand"
                    onClick={() =>
                      startTransition(async () => {
                        await handleSaveDraft(false);
                        const result = await sendSstDraftForReview(detail.id);
                        if (!result.success) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success("Enviado para revisão.");
                        await loadDetail(detail.id);
                        router.refresh();
                      })
                    }
                  >
                    Enviar para revisão
                  </Button>
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-2 text-sm font-semibold text-[var(--brand-navy)]">
                Prévia paginada
              </h3>
              <pre className="sst-preview-page whitespace-pre-wrap">{previewPages[previewPage]}</pre>
              <div className="mt-2 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={previewPage <= 0}
                  onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                >
                  Página anterior
                </Button>
                <span className="text-xs text-[var(--dash-text-muted)]">
                  Página {previewPage + 1} de {previewPages.length}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={previewPage >= previewPages.length - 1}
                  onClick={() => setPreviewPage((p) => Math.min(previewPages.length - 1, p + 1))}
                >
                  Próxima página
                </Button>
              </div>
              <p className="mt-2 text-xs text-[var(--dash-text-muted)]">
                Texto assistido apenas com seções preenchidas. Pendências não são preenchidas
                automaticamente.
              </p>
            </section>

            {Array.isArray(detail.checklist) && detail.checklist.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--brand-navy)]">
                  Verificação de dados
                </h3>
                <ul className="sst-checklist">
                  {detail.checklist.map((item) => (
                    <li key={item.key} className={checklistStatusClass(item.status)}>
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(detail.stage === "AGUARDANDO_REVISAO" || detail.stage === "APROVADO") && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--brand-navy)]">Revisão</h3>
                <Textarea
                  rows={3}
                  placeholder="Comentário de revisão"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      startTransition(async () => {
                        const result = await addSstDraftComment({
                          id: detail.id,
                          content: comment,
                        });
                        if (!result.success) {
                          toast.error(result.error);
                          return;
                        }
                        setComment("");
                        toast.success("Comentário adicionado.");
                        await loadDetail(detail.id);
                      })
                    }
                  >
                    Adicionar comentário
                  </Button>
                  {detail.stage === "AGUARDANDO_REVISAO" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() =>
                          startTransition(async () => {
                            const reason = returnComment.trim() || comment.trim();
                            if (!reason) {
                              toast.error("Informe o motivo da devolução.");
                              return;
                            }
                            const result = await returnSstDraftForCorrection(detail.id, reason);
                            if (!result.success) {
                              toast.error(result.error);
                              return;
                            }
                            toast.success("Devolvido para correção.");
                            setReturnComment("");
                            await loadDetail(detail.id);
                            router.refresh();
                          })
                        }
                      >
                        Devolver para correção
                      </Button>
                      <Button
                        variant="brand"
                        onClick={() =>
                          startTransition(async () => {
                            const result = await approveSstDraft(detail.id);
                            if (!result.success) {
                              toast.error(result.error);
                              return;
                            }
                            toast.success("Documento aprovado.");
                            await loadDetail(detail.id);
                            router.refresh();
                          })
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                    </>
                  )}
                </div>
                {detail.stage === "AGUARDANDO_REVISAO" && (
                  <Textarea
                    rows={2}
                    placeholder="Motivo da devolução (se devolver)"
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                  />
                )}
              </section>
            )}

            {detail.stage === "APROVADO" && (
              <section className="space-y-3 rounded-lg border border-[var(--dash-border)] p-3">
                <h3 className="text-sm font-semibold text-[var(--brand-navy)]">Finalização</h3>
                <p className="text-sm text-[var(--dash-text-muted)]">
                  Gera o registro em Documentos da empresa, com responsável e data de aprovação.
                  {detail.publishedDocument
                    ? ` Já publicado: ${detail.publishedDocument.title}.`
                    : ""}
                </p>
                <SystemModalField label="Validade">
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </SystemModalField>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="brand"
                    disabled={!!detail.publishedDocument}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await finalizeSstDraft({
                          id: detail.id,
                          validUntil: validUntil || null,
                        });
                        if (!result.success) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success("Documento salvo em Documentos da empresa.");
                        await loadDetail(detail.id);
                        router.refresh();
                      })
                    }
                  >
                    Gerar PDF / salvar em Documentos
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    Imprimir prévia
                  </Button>
                </div>
              </section>
            )}

            {detail.comments.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--brand-navy)]">Comentários</h3>
                <ul className="space-y-2">
                  {detail.comments.map((c) => (
                    <li key={c.id} className="rounded-md bg-slate-50 p-2 text-sm">
                      <p>{c.content}</p>
                      <p className="mt-1 text-xs text-[var(--dash-text-muted)]">
                        {c.createdByName} ·{" "}
                        {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {detail.versions.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--brand-navy)]">
                  Histórico de versões
                </h3>
                <ul className="space-y-1 text-sm">
                  {detail.versions.map((v) => (
                    <li key={v.id}>
                      v{v.version} · {SST_STAGE_LABELS[v.stage]} · {v.createdByName} ·{" "}
                      {format(new Date(v.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      {v.notes ? ` — ${v.notes}` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </DetailDrawer>
    </PageModule>
  );
}
