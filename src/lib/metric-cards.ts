import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  Building,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Clock3,
  Download,
  FileCheck,
  FileClock,
  FileText,
  FileWarning,
  FolderOpen,
  Inbox,
  Link2Off,
  Receipt,
  SearchCheck,
  Sparkles,
  Stethoscope,
  Upload,
  UserX,
  Users,
  Wallet,
  XCircle,
  Calculator,
  Tags,
  Ban,
  FlaskConical,
  Eye,
  MessageSquare,
  Send,
  ThumbsDown,
  ThumbsUp,
  LifeBuoy,
  ListTodo,
  UserCheck,
  Newspaper,
  FilePen,
  AlertTriangle,
  Calendar,
} from "lucide-react";

export type MetricTone = "default" | "success" | "warning" | "danger" | "info" | "finance";

export type MetricMeta = {
  tone: MetricTone;
  icon: LucideIcon;
  description?: string;
  badge?: string;
};

const DEFAULT_META: MetricMeta = {
  tone: "default",
  icon: Activity,
};

export const METRIC_META: Record<string, MetricMeta> = {
  // Empresas
  "company:ativas": {
    tone: "success",
    icon: Building2,
    description: "Clientes com operação ativa",
  },
  "company:inativas": {
    tone: "default",
    icon: Building,
    description: "Cadastros sem operação ativa",
  },
  "company:com_pendencias": {
    tone: "warning",
    icon: FileWarning,
    description: "Documentos a regularizar",
  },
  "company:com_portal": {
    tone: "info",
    icon: ClipboardList,
    description: "Acesso liberado",
  },
  "company:atendimentos_abertos": {
    tone: "info",
    icon: ClipboardList,
    description: "Atendimentos ainda em andamento",
  },
  "company:docs_pendentes": {
    tone: "warning",
    icon: FileWarning,
    description: "Documentos a regularizar",
  },
  "company:ref_abertos": {
    tone: "info",
    icon: ClipboardList,
    description: "Atendimentos ainda em andamento",
  },
  "company:orc_pendentes": {
    tone: "warning",
    icon: Receipt,
    description: "Propostas aguardando resposta",
  },

  // Colaboradores
  "collaborator:ativos": {
    tone: "success",
    icon: Users,
    description: "Colaboradores com cadastro ativo",
  },
  "collaborator:inativos": {
    tone: "default",
    icon: UserX,
    description: "Cadastros inativos ou desligados",
  },
  "collaborator:agendados": {
    tone: "info",
    icon: CalendarCheck,
    description: "Atendimentos já programados",
  },
  "collaborator:docs_pendentes": {
    tone: "warning",
    icon: FileWarning,
    description: "Documentação incompleta",
    badge: "Ação",
  },
  "collaborator:periodico_vencer": {
    tone: "warning",
    icon: Clock,
    description: "Exame periódico próximo do vencimento",
  },
  "collaborator:sem_empresa": {
    tone: "default",
    icon: Link2Off,
    description: "Sem vínculo empresarial definido",
  },

  // Documentos
  "document:pendentes": {
    tone: "warning",
    icon: FileWarning,
    description: "Precisa de upload ou liberação",
    badge: "Ação",
  },
  "document:em_emissao": {
    tone: "info",
    icon: FileClock,
    description: "Em elaboração pela clínica",
  },
  "document:disponiveis": {
    tone: "success",
    icon: FileCheck,
    description: "Liberados para consulta",
  },
  "document:para_baixar": {
    tone: "success",
    icon: Download,
    description: "Arquivo anexado — baixar agora",
  },
  "document:asos": {
    tone: "success",
    icon: FileCheck,
    description: "ASOs com arquivo",
  },
  "document:aguardando": {
    tone: "warning",
    icon: FileClock,
    description: "Clínica ainda não anexou o PDF",
  },
  "document:mes": {
    tone: "info",
    icon: FolderOpen,
    description: "Anexados neste mês",
  },
  "document:vencidos": {
    tone: "danger",
    icon: AlertCircle,
    description: "Validade expirada — renovar",
    badge: "Crítico",
  },
  "document:asos_pendentes": {
    tone: "warning",
    icon: FileText,
    description: "ASOs aguardando emissão",
  },

  // Pré-encaminhamentos
  "pre_referral:queue_active": {
    tone: "info",
    icon: Inbox,
    description: "Solicitações na fila operacional",
  },
  "pre_referral:NOVO": {
    tone: "info",
    icon: Sparkles,
    description: "Recém recebidos pelo portal",
  },
  "pre_referral:EM_ANALISE": {
    tone: "info",
    icon: SearchCheck,
    description: "Em triagem pela equipe",
  },
  "pre_referral:AGUARDANDO_RETORNO": {
    tone: "warning",
    icon: Clock3,
    description: "Aguardando retorno do solicitante",
  },
  "pre_referral:CONVERTIDO": {
    tone: "success",
    icon: CheckCircle2,
    description: "Convertidos em encaminhamento",
  },
  "pre_referral:CANCELADO": {
    tone: "danger",
    icon: XCircle,
    description: "Solicitações encerradas",
  },

  // Encaminhamentos
  "referral:NOVO": { tone: "info", icon: Sparkles, description: "Novos na fila" },
  "referral:EM_ANALISE": { tone: "info", icon: SearchCheck, description: "Em triagem clínica" },
  "referral:AGUARDANDO_AGENDAMENTO": {
    tone: "warning",
    icon: Clock3,
    description: "Aguardando data de exame",
  },
  "referral:AGENDADO": { tone: "info", icon: CalendarCheck, description: "Com data confirmada" },
  "referral:EM_ATENDIMENTO": { tone: "info", icon: Stethoscope, description: "Em sala de atendimento" },
  "referral:AGUARDANDO_RESULTADO": {
    tone: "warning",
    icon: Clock,
    description: "Aguardando laudo ou resultado",
  },
  "referral:AGUARDANDO_DOCUMENTO": {
    tone: "warning",
    icon: FileClock,
    description: "Documentação pendente",
  },
  "referral:ASO_DISPONIVEL": { tone: "success", icon: FileCheck, description: "ASO liberado" },
  "referral:CONCLUIDO": { tone: "success", icon: CheckCircle2, description: "Processo finalizado" },
  "referral:CANCELADO": { tone: "danger", icon: XCircle, description: "Encaminhamentos cancelados" },

  // Encaminhamentos — portal RH
  "referral:AGENDADOS": {
    tone: "info",
    icon: CalendarCheck,
    description: "Colaboradores encaminhados à clínica",
  },
  "referral:ASO_PENDENTE": {
    tone: "warning",
    icon: FileClock,
    description: "Encaminhados sem ASO liberado",
  },

  // Agenda
  "appointment:today": { tone: "info", icon: CalendarCheck, description: "Agendados para hoje" },
  "appointment:confirmado": { tone: "success", icon: CheckCircle2, description: "Presença confirmada" },
  "appointment:em_atendimento": { tone: "info", icon: Stethoscope, description: "Em atendimento agora" },
  "appointment:concluido": { tone: "success", icon: CheckCircle2, description: "Atendimentos finalizados" },
  "appointment:faltou": { tone: "danger", icon: UserX, description: "Ausências registradas" },
  "appointment:cancelado": { tone: "danger", icon: XCircle, description: "Agendamentos cancelados" },

  // Orçamentos / comercial
  "commercial:solicitacoes_novas": {
    tone: "info",
    icon: Sparkles,
    description: "Novas solicitações de orçamento",
  },
  "commercial:em_analise": { tone: "info", icon: SearchCheck, description: "Em análise comercial" },
  "commercial:orcamentos_enviados": { tone: "info", icon: Send, description: "Propostas enviadas" },
  "commercial:aguardando_resposta": {
    tone: "warning",
    icon: Clock3,
    description: "Aguardando retorno do cliente",
  },
  "commercial:aprovados": { tone: "success", icon: ThumbsUp, description: "Orçamentos aprovados" },
  "commercial:recusados": { tone: "danger", icon: ThumbsDown, description: "Propostas recusadas" },
  "commercial:contatos_sem_retorno": {
    tone: "warning",
    icon: MessageSquare,
    description: "Contatos sem retorno da clínica",
  },

  // Exames (catálogo)
  "exam:ativos": { tone: "success", icon: FlaskConical, description: "Disponíveis para agendamento" },
  "exam:inativos": { tone: "default", icon: Ban, description: "Fora do catálogo ativo" },
  "exam:sem_preparo": { tone: "default", icon: FileText, description: "Sem preparo específico" },
  "exam:preparo_obrigatorio": {
    tone: "warning",
    icon: AlertCircle,
    description: "Exigem orientação ao paciente",
  },
  "exam:laboratoriais": { tone: "info", icon: FlaskConical, description: "Exames laboratoriais" },
  "exam:no_site": { tone: "info", icon: Eye, description: "Visíveis no site público" },

  // Visão geral
  "overview:pre_referrals": {
    tone: "info",
    icon: Inbox,
    description: "Solicitações na fila ativa",
  },
  "overview:pending_docs": {
    tone: "warning",
    icon: FileWarning,
    description: "Documentos aguardando ação",
  },
  "overview:docs_expiring": {
    tone: "warning",
    icon: Clock,
    description: "Validade próxima do vencimento",
  },
  "overview:pending_quotes": {
    tone: "warning",
    icon: Receipt,
    description: "Orçamentos em negociação",
  },
  "overview:closings_open": {
    tone: "info",
    icon: Calculator,
    description: "Fechamentos em andamento",
  },
  "overview:payments_overdue": {
    tone: "danger",
    icon: AlertCircle,
    description: "Pagamentos em atraso",
    badge: "Ação",
  },
  "overview:tickets_open": {
    tone: "info",
    icon: LifeBuoy,
    description: "Chamados em aberto",
  },
  "overview:tasks_today": {
    tone: "info",
    icon: ListTodo,
    description: "Tarefas com vencimento hoje",
  },
  "overview:companies_pending": {
    tone: "warning",
    icon: Building2,
    description: "Empresas com pendências",
  },
  "overview:docs_released": {
    tone: "success",
    icon: FileCheck,
    description: "Documentos liberados no mês",
  },
  "overview:collaborators_active": {
    tone: "success",
    icon: Users,
    description: "Colaboradores ativos na empresa",
  },
  "overview:referrals_open": {
    tone: "info",
    icon: FileText,
    description: "Encaminhamentos em andamento",
  },
  "overview:appointments_today": {
    tone: "info",
    icon: CalendarCheck,
    description: "Exames agendados para hoje",
  },
  "overview:docs_available": {
    tone: "success",
    icon: Download,
    description: "ASOs e laudos prontos para baixar",
  },
  "overview:periodic_due": {
    tone: "warning",
    icon: Clock,
    description: "Colaboradores com periódico próximo",
    badge: "Ação",
  },

  // Financeiro
  "finance:receivable_month": {
    tone: "finance",
    icon: Wallet,
    description: "Total previsto para o mês",
  },
  "finance:received": {
    tone: "success",
    icon: Receipt,
    description: "Valores já recebidos",
  },
  "finance:overdue": {
    tone: "danger",
    icon: AlertCircle,
    description: "Contas vencidas",
  },
  "finance:awaiting_invoice": {
    tone: "warning",
    icon: Clock,
    description: "Aguardando emissão de fatura",
  },
  "finance:pending_companies": {
    tone: "info",
    icon: Building2,
    description: "Empresas com pendência financeira",
  },

  // Fechamento
  "closing:open": {
    tone: "info",
    icon: Calculator,
    description: "Fechamentos em revisão",
  },
  "closing:imports": {
    tone: "default",
    icon: Upload,
    description: "Importações no mês corrente",
  },
  "closing:without_price": {
    tone: "warning",
    icon: Tags,
    description: "Itens sem preço cadastrado",
  },
  "closing:divergences": {
    tone: "danger",
    icon: AlertCircle,
    description: "Divergências a corrigir",
  },
  "closing:total_preview": {
    tone: "finance",
    icon: Wallet,
    description: "Valor total previsto",
  },

  // Tarefas
  "task:pendentes": { tone: "warning", icon: ListTodo, description: "Aguardando início" },
  "task:em_andamento": { tone: "info", icon: Activity, description: "Em execução pela equipe" },
  "task:concluidas": { tone: "success", icon: CheckCircle2, description: "Finalizadas" },
  "task:atrasadas": { tone: "danger", icon: AlertTriangle, description: "Prazo vencido", badge: "Ação" },
  "task:hoje": { tone: "warning", icon: Calendar, description: "Vencimento hoje" },
  "task:urgentes": { tone: "danger", icon: AlertCircle, description: "Prioridade alta ou crítica" },

  // Chamados
  "ticket:abertos": { tone: "info", icon: Inbox, description: "Novos chamados na fila" },
  "ticket:em_atendimento": { tone: "info", icon: LifeBuoy, description: "Em atendimento pela equipe" },
  "ticket:aguardando": { tone: "warning", icon: Clock3, description: "Aguardando retorno do cliente" },
  "ticket:resolvidos": { tone: "success", icon: CheckCircle2, description: "Problemas resolvidos" },
  "ticket:fechados": { tone: "default", icon: XCircle, description: "Chamados encerrados" },
  "ticket:alta_prioridade": { tone: "danger", icon: AlertCircle, description: "Prioridade alta ou crítica" },

  // Conteúdo
  "content:total": { tone: "default", icon: Newspaper, description: "Total de publicações" },
  "content:published": { tone: "success", icon: Eye, description: "Visíveis no site" },
  "content:drafts": { tone: "warning", icon: FilePen, description: "Rascunhos não publicados" },

  // Usuários
  "user:total": { tone: "default", icon: Users, description: "Contas cadastradas" },
  "user:active": { tone: "success", icon: UserCheck, description: "Com acesso ativo" },
  "user:inactive": { tone: "default", icon: UserX, description: "Acesso desativado" },

  // Detalhe empresa
  "company_detail:employees": { tone: "info", icon: Users, description: "Colaboradores vinculados" },
  "company_detail:open_referrals": { tone: "info", icon: ClipboardList, description: "Encaminhamentos em andamento" },
  "company_detail:upcoming_appointments": { tone: "info", icon: CalendarCheck, description: "Próximos atendimentos" },
  "company_detail:pending_documents": { tone: "warning", icon: FileWarning, description: "Documentação pendente" },
  "company_detail:pending_quotes": { tone: "warning", icon: Receipt, description: "Orçamentos em abertura" },

  // Detalhe colaborador
  "collaborator_detail:open_referrals": { tone: "info", icon: ClipboardList, description: "Encaminhamentos ativos" },
  "collaborator_detail:upcoming_appointments": { tone: "info", icon: CalendarCheck, description: "Exames agendados" },
  "collaborator_detail:available_documents": { tone: "success", icon: FileCheck, description: "Documentos liberados" },
  "collaborator_detail:pending_exams": { tone: "warning", icon: Clock, description: "Exames pendentes" },
  "collaborator_detail:last_exam": { tone: "default", icon: Stethoscope, description: "Último exame registrado" },
};

export function getMetricMeta(key: string): MetricMeta {
  return METRIC_META[key] ?? DEFAULT_META;
}

export type LegacyMetricVariant =
  | "neutral"
  | "positive"
  | "attention"
  | "critical"
  | "financial"
  | "operational";

export function normalizeMetricTone(
  variant?: MetricTone | LegacyMetricVariant
): MetricTone {
  if (!variant) return "default";
  const map: Record<string, MetricTone> = {
    default: "default",
    neutral: "default",
    success: "success",
    positive: "success",
    warning: "warning",
    attention: "warning",
    danger: "danger",
    critical: "danger",
    info: "info",
    operational: "info",
    finance: "finance",
    financial: "finance",
  };
  return map[variant] ?? "default";
}
