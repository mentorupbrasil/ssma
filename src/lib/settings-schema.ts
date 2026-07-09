export type SettingFieldType = "text" | "textarea" | "boolean" | "number" | "email" | "time";

export type SettingFieldDef = {
  key: string;
  label: string;
  description?: string;
  type: SettingFieldType;
  placeholder?: string;
  defaultValue?: string;
};

export type SettingsSection = {
  id: string;
  label: string;
  description: string;
  fields: SettingFieldDef[];
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "clinica",
    label: "Clínica",
    description: "Dados institucionais exibidos no site e documentos.",
    fields: [
      { key: "clinic.display_name", label: "Nome de exibição", type: "text", placeholder: "Unimetra" },
      { key: "clinic.phone", label: "Telefone", type: "text" },
      { key: "clinic.whatsapp", label: "WhatsApp", type: "text" },
      { key: "clinic.email", label: "E-mail", type: "email" },
      { key: "clinic.address", label: "Endereço", type: "textarea" },
      { key: "clinic.hours", label: "Horário de atendimento", type: "text", placeholder: "Seg–Sex 8h–18h" },
    ],
  },
  {
    id: "operacional",
    label: "Operacional",
    description: "Parâmetros do fluxo clínico e comercial.",
    fields: [
      { key: "ops.default_room", label: "Sala padrão", type: "text", placeholder: "Sala 1" },
      { key: "ops.appointment_duration_min", label: "Duração padrão (min)", type: "number", defaultValue: "30" },
      { key: "ops.quote_validity_days", label: "Validade padrão orçamento (dias)", type: "number", defaultValue: "15" },
      { key: "ops.pre_referral_sla_hours", label: "SLA pré-encaminhamento (h)", type: "number", defaultValue: "24" },
    ],
  },
  {
    id: "documentos",
    label: "Documentos",
    description: "Regras de retenção e avisos LGPD.",
    fields: [
      { key: "docs.retention_years", label: "Retenção mínima (anos)", type: "number", defaultValue: "20" },
      { key: "docs.lgpd_notice", label: "Aviso LGPD em downloads", type: "textarea", placeholder: "Documento confidencial..." },
      { key: "docs.require_consent", label: "Exigir consentimento no portal", type: "boolean", defaultValue: "true" },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    description: "Padrões de cobrança e faturamento.",
    fields: [
      { key: "fin.default_payment_terms", label: "Condição de pagamento padrão", type: "text", placeholder: "30 dias" },
      { key: "fin.invoice_prefix", label: "Prefixo de fatura", type: "text", placeholder: "NF-" },
      { key: "fin.auto_receivable_on_quote", label: "Gerar conta a receber ao aprovar orçamento", type: "boolean", defaultValue: "true" },
    ],
  },
  {
    id: "portal",
    label: "Portal empresarial",
    description: "Comportamento do portal para empresas clientes.",
    fields: [
      { key: "portal.welcome_message", label: "Mensagem de boas-vindas", type: "textarea" },
      { key: "portal.allow_pre_referral", label: "Permitir pré-encaminhamento", type: "boolean", defaultValue: "true" },
      { key: "portal.show_exam_catalog", label: "Exibir catálogo de exames", type: "boolean", defaultValue: "true" },
    ],
  },
  {
    id: "lgpd",
    label: "LGPD e privacidade",
    description: "Textos legais e políticas de dados.",
    fields: [
      { key: "lgpd.dpo_name", label: "Encarregado (DPO)", type: "text" },
      { key: "lgpd.dpo_email", label: "E-mail do DPO", type: "email" },
      { key: "lgpd.privacy_summary", label: "Resumo da política de privacidade", type: "textarea" },
      { key: "lgpd.consent_text", label: "Texto de consentimento", type: "textarea" },
    ],
  },
];

export function getAllSettingKeys(): string[] {
  return SETTINGS_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
}

export function settingsMapFromRows(rows: { key: string; value: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  for (const section of SETTINGS_SECTIONS) {
    for (const field of section.fields) {
      if (!(field.key in map) && field.defaultValue != null) {
        map[field.key] = field.defaultValue;
      }
    }
  }
  return map;
}
