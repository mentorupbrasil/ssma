/** Semantic tone for premium status badges */
export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "violet"
  | "brand";

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  NOVO: "info",
  EM_ANALISE: "warning",
  AGUARDANDO_AGENDAMENTO: "warning",
  AGENDADO: "violet",
  EM_ATENDIMENTO: "info",
  AGUARDANDO_RESULTADO: "info",
  AGUARDANDO_DOCUMENTO: "violet",
  ASO_DISPONIVEL: "brand",
  CONCLUIDO: "success",
  CONVERTIDO: "success",
  AGUARDANDO_RETORNO: "warning",
  DUPLICADO: "violet",
  CANCELADO: "neutral",
  EM_CONTATO: "warning",
  PROPOSTA_ENVIADA: "violet",
  FECHADO: "success",
  PERDIDO: "neutral",
  CONFIRMADO: "violet",
  REAGENDADO: "warning",
  REALIZADO: "success",
  FALTOU: "danger",
  PENDENTE: "warning",
  EM_EMISSAO: "info",
  DISPONIVEL: "success",
  EM_ELABORACAO: "info",
  EM_DIA: "success",
  ENTREGUE: "success",
  RESPONDIDO: "success",
  ARQUIVADO: "neutral",
  EM_CONFERENCIA: "info",
  COM_DIVERGENCIA: "danger",
  AGUARDANDO_APROVACAO: "warning",
  AGUARDANDO_FATURAMENTO: "violet",
  CONFERIDO: "success",
  FATURADO: "brand",
  EM_ATRASO: "danger",
  ATIVA: "success",
  INATIVA: "neutral",
  VENCIDA: "warning",
  BLOQUEADA: "danger",
  VENCIDO: "danger",
  EXPIRADO: "warning",
  ATIVO: "success",
  INATIVO: "neutral",
  AFASTADO: "warning",
  DESLIGADO: "danger",
  EM_REVISAO: "warning",
  RASCUNHO: "neutral",
  ENVIADO: "info",
  AGUARDANDO_RESPOSTA: "warning",
  APROVADO: "success",
  RECUSADO: "danger",
  CONVERTIDO_ORCAMENTO: "brand",
  PAGO: "success",
  ATRASADO: "danger",
  ABERTO: "info",
  RESOLVIDO: "success",
};

export function getStatusTone(status: string): StatusTone {
  return STATUS_TONE_MAP[status] ?? "neutral";
}
