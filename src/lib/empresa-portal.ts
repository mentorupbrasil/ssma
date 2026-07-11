import type { ReferralStatus } from "@prisma/client";
import { COLLABORATOR_STAT_CARDS } from "@/lib/collaborators";
import { APPOINTMENT_STAT_CARDS } from "@/lib/appointments";
import { TICKET_STAT_CARDS } from "@/lib/tickets";
import { isCompanyHr } from "@/lib/tenant";
import { REFERRAL_STATUS_LABELS } from "@/types";
import type { UserRole } from "@/types/roles";

export function isEmpresaPortalRole(role: UserRole): boolean {
  return isCompanyHr(role);
}

/** Itens ocultos no menu lateral do RH */
export const EMPRESA_HIDDEN_NAV_HREFS = [
  "/dashboard/pre-encaminhamentos",
  "/dashboard/agenda",
];

/** Rótulos customizados no menu do RH */
export const EMPRESA_NAV_LABEL_OVERRIDES: Record<string, string> = {
  "/dashboard/encaminhamentos": "Exames",
  "/dashboard/exames": "Preparos",
  "/dashboard/documentos": "ASOs e documentos",
};

/** Ícones customizados no menu do RH */
export const EMPRESA_NAV_ICON_OVERRIDES: Record<string, string> = {
  "/dashboard/encaminhamentos": "ClipboardList",
};

export const EMPRESA_EXAMES_BASE_PATH = "/dashboard/encaminhamentos";

/** Cards de status na tela Exames — visão simplificada do RH */
export const EMPRESA_REFERRAL_STAT_CARDS: { status: ReferralStatus; label: string }[] = [
  { status: "NOVO", label: "Encaminhados" },
  { status: "EM_ANALISE", label: "Em andamento" },
  { status: "EM_ATENDIMENTO", label: "Na clínica" },
  { status: "AGUARDANDO_DOCUMENTO", label: "Aguardando ASO" },
  { status: "ASO_DISPONIVEL", label: "ASO disponível" },
  { status: "CONCLUIDO", label: "Concluídos" },
  { status: "CANCELADO", label: "Cancelados" },
];

/** Rótulos amigáveis para o RH (sem jargão de agenda da clínica) */
export const EMPRESA_REFERRAL_STATUS_LABELS: Partial<Record<ReferralStatus, string>> = {
  NOVO: "Encaminhado",
  EM_ANALISE: "Em andamento",
  AGUARDANDO_AGENDAMENTO: "Autorizado",
  AGENDADO: "Autorizado",
  EM_ATENDIMENTO: "Na clínica",
  AGUARDANDO_RESULTADO: "Aguardando resultado",
  AGUARDANDO_DOCUMENTO: "Aguardando ASO",
  ASO_DISPONIVEL: "ASO disponível",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export function empresaReferralStatusLabel(status: ReferralStatus): string {
  return EMPRESA_REFERRAL_STATUS_LABELS[status] ?? REFERRAL_STATUS_LABELS[status];
}

export const EMPRESA_NAV_SECTIONS = [
  { label: "Geral", hrefs: ["/dashboard"] },
  {
    label: "Operação",
    hrefs: [
      "/dashboard/colaboradores",
      "/dashboard/encaminhamentos",
      "/dashboard/documentos",
      "/dashboard/exames",
    ],
  },
  { label: "Suporte", hrefs: ["/dashboard/chamados"] },
] as const;

/** Whitelist de rotas visíveis no menu do RH */
export const EMPRESA_NAV_HREFS: readonly string[] = EMPRESA_NAV_SECTIONS.flatMap(
  (section) => section.hrefs
);

export function collaboratorStatCardsForEmpresa() {
  return COLLABORATOR_STAT_CARDS.filter((c) => c.key !== "sem_empresa");
}

export function appointmentStatCardsForEmpresa() {
  return APPOINTMENT_STAT_CARDS.filter((c) => c.key !== "em_atendimento");
}

export function referralStatCardsForEmpresa() {
  return EMPRESA_REFERRAL_STAT_CARDS;
}

/** Cards da tela Documentos — portal RH (foco em download) */
export const EMPRESA_DOCUMENT_STAT_CARDS = [
  { key: "para_baixar", filter: "PARA_BAIXAR", label: "Para baixar" },
  { key: "asos", filter: "ASO_ARQUIVO", label: "ASOs" },
  { key: "aguardando", filter: "AGUARDANDO_ARQUIVO", label: "Aguardando arquivo" },
  { key: "mes", filter: "MES_ARQUIVO", label: "Novos este mês" },
] as const;

export function documentStatCardsForEmpresa() {
  return EMPRESA_DOCUMENT_STAT_CARDS.map((c) => ({ ...c }));
}

/** Documentos da empresa com arquivo anexado pela clínica */
export function empresaDocumentDownloadableWhere(
  companyId: string
): { companyId: string; fileUrl: { not: null }; status: { notIn: ["ARQUIVADO", "CANCELADO"] } } {
  return {
    companyId,
    fileUrl: { not: null },
    status: { notIn: ["ARQUIVADO", "CANCELADO"] },
  };
}

export function applyEmpresaDocumentCardFilter(
  where: import("@prisma/client").Prisma.DocumentWhereInput,
  card?: string
): import("@prisma/client").Prisma.DocumentWhereInput {
  if (!card || card === "ALL") return where;

  if (card === "PARA_BAIXAR") {
    return { ...where, fileUrl: { not: null }, status: { notIn: ["ARQUIVADO", "CANCELADO"] } };
  }
  if (card === "ASO_ARQUIVO") {
    return {
      ...where,
      type: "ASO",
      fileUrl: { not: null },
      status: { notIn: ["ARQUIVADO", "CANCELADO"] },
    };
  }
  if (card === "AGUARDANDO_ARQUIVO") {
    return { ...where, fileUrl: null, status: { notIn: ["ARQUIVADO", "CANCELADO", "DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"] } };
  }
  if (card === "MES_ARQUIVO") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      ...where,
      fileUrl: { not: null },
      createdAt: { gte: monthStart, lte: monthEnd },
    };
  }
  return where;
}

export function ticketStatCardsForEmpresa() {
  return TICKET_STAT_CARDS.filter(
    (c) => !["fechados", "aguardando", "alta_prioridade"].includes(c.key)
  );
}

/** Cabeçalho do CSV de importação em massa de colaboradores */
export const COLLABORATOR_IMPORT_CSV_HEADER =
  "nome_completo;cpf;data_nascimento;sexo;telefone;funcao;setor;rg";

export const COLLABORATOR_IMPORT_CSV_SAMPLE = `${COLLABORATOR_IMPORT_CSV_HEADER}
Carlos Eduardo Santos;52998224725;1985-03-15;M;(99) 99000-1001;Operador de máquinas;Produção;123456789
Fernanda Lima Oliveira;39053344705;1990-07-22;F;(99) 99000-2002;Auxiliar administrativo;Administrativo;`;
