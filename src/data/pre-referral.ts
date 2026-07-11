export const ENCAMINHAMENTO_HERO_BADGES = [
  "Solicitação com protocolo",
  "Confirmação pelo WhatsApp",
  "Tratamento seguro dos dados",
  "Atendimento ágil",
] as const;

export const PRE_REFERRAL_EXAM_OPTIONS = [
  "Audiometria",
  "Acuidade visual",
  "Avaliação oftalmológica",
  "Avaliação psicológica",
  "Eletrocardiograma",
  "Eletroencefalograma",
  "Espirometria",
  "Raio-X",
  "Exames laboratoriais",
  "Toxicológico",
] as const;

export const WHATSAPP_PRE_REFERRAL_TEMPLATE = `Olá! Quero encaminhar um colaborador para exame ocupacional.

Empresa:
Responsável:
Telefone:
Colaborador:
Função:
Tipo de exame:
Observações:`;

export function buildPreReferralWhatsAppMessage(params: {
  protocol: string;
  companyName: string;
  employeeName: string;
  clinicalExamType: string;
}): string {
  return `Olá! Enviei um pré-encaminhamento pelo site.

Protocolo: ${params.protocol}
Empresa: ${params.companyName}
Colaborador: ${params.employeeName}
Tipo de exame: ${params.clinicalExamType}

Gostaria de confirmar os próximos passos.`;
}
