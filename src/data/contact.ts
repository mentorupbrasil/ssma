export const CONTACT_HERO_BADGES = [
  "Orçamentos",
  "Encaminhamentos",
  "Dúvidas sobre exames",
  "Suporte ao RH",
] as const;

export const CONTACT_SUBJECTS = [
  "Solicitar orçamento",
  "Encaminhamento de colaborador",
  "Dúvida sobre exames",
  "Portal empresarial",
  "Suporte para empresa",
  "Outro",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const CONTACT_WHATSAPP_MESSAGES = {
  direct: "Olá! Vim pelo site da Unimetra e gostaria de atendimento.",
  quote: "Olá! Gostaria de solicitar um orçamento para minha empresa.",
  referral: "Olá! Quero encaminhar um colaborador para exame ocupacional.",
  afterSubmit: "Olá! Acabei de enviar uma mensagem pelo site e gostaria de conversar.",
} as const;

export function resolveContactPrefill(params: {
  tipo?: string;
  servico?: string;
}): { subject: string; message: string } {
  if (params.servico) {
    return {
      subject: "Solicitar orçamento",
      message: `Tenho interesse no serviço: ${decodeURIComponent(params.servico)}.`,
    };
  }

  switch (params.tipo) {
    case "orcamento":
      return { subject: "Solicitar orçamento", message: "" };
    case "encaminhamento":
      return { subject: "Encaminhamento de colaborador", message: "" };
    case "portal":
    case "acesso-portal":
      return { subject: "Portal empresarial", message: "" };
    default:
      return { subject: "", message: "" };
  }
}
