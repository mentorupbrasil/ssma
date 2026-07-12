export type SettingFieldType = "text" | "textarea" | "boolean" | "number" | "email" | "url";

export type SettingFieldDef = {
  key: string;
  label: string;
  description?: string;
  type: SettingFieldType;
  placeholder?: string;
  defaultValue?: string;
  /** Campo ocupa as duas colunas no desktop. */
  wide?: boolean;
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
    description: "Dados institucionais usados no atendimento e na comunicação.",
    fields: [
      { key: "clinic.display_name", label: "Nome de exibição", type: "text", placeholder: "Unimetra" },
      { key: "clinic.legal_name", label: "Razão social", type: "text", placeholder: "Razão social completa" },
      { key: "clinic.cnpj", label: "CNPJ", type: "text", placeholder: "00.000.000/0000-00" },
      { key: "clinic.email", label: "E-mail", type: "email", placeholder: "contato@clinica.com.br" },
      { key: "clinic.phone", label: "Telefone", type: "text", placeholder: "(99) 0000-0000" },
      { key: "clinic.whatsapp", label: "WhatsApp", type: "text", placeholder: "(99) 90000-0000" },
      { key: "clinic.zip", label: "CEP", type: "text", placeholder: "00000-000" },
      { key: "clinic.city_state", label: "Cidade/UF", type: "text", placeholder: "Imperatriz/MA" },
      {
        key: "clinic.address",
        label: "Endereço completo",
        type: "text",
        placeholder: "Rua, número e complemento",
        wide: true,
      },
      {
        key: "clinic.hours",
        label: "Horário de atendimento",
        type: "text",
        placeholder: "Seg–Sex 8h–18h",
        wide: true,
      },
      {
        key: "clinic.logo_url",
        label: "Logo da clínica",
        type: "url",
        placeholder: "https://…",
        description: "Link da imagem do logo usada em documentos e comunicações.",
        wide: true,
      },
    ],
  },
  {
    id: "operacional",
    label: "Operacional",
    description: "Parâmetros do fluxo clínico e comercial.",
    fields: [
      { key: "ops.default_room", label: "Sala padrão", type: "text", placeholder: "Sala 1" },
      {
        key: "ops.appointment_duration_min",
        label: "Duração padrão (min)",
        type: "number",
        defaultValue: "30",
      },
      {
        key: "ops.quote_validity_days",
        label: "Validade padrão orçamento (dias)",
        type: "number",
        defaultValue: "15",
      },
      {
        key: "ops.pre_referral_sla_hours",
        label: "SLA pré-encaminhamento (h)",
        type: "number",
        defaultValue: "24",
      },
    ],
  },
  {
    id: "documentos",
    label: "Documentos",
    description: "Retenção e avisos em documentos ocupacionais.",
    fields: [
      {
        key: "docs.retention_years",
        label: "Retenção mínima (anos)",
        type: "number",
        defaultValue: "20",
      },
      {
        key: "docs.lgpd_notice",
        label: "Aviso LGPD em downloads",
        type: "textarea",
        placeholder: "Documento confidencial…",
        wide: true,
      },
      {
        key: "docs.require_consent",
        label: "Exigir consentimento no portal",
        type: "boolean",
        defaultValue: "true",
      },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    description: "Padrões de cobrança e faturamento.",
    fields: [
      {
        key: "fin.default_payment_terms",
        label: "Condição de pagamento padrão",
        type: "text",
        placeholder: "30 dias",
      },
      {
        key: "fin.invoice_prefix",
        label: "Prefixo de fatura",
        type: "text",
        placeholder: "NF-",
      },
      {
        key: "fin.auto_receivable_on_quote",
        label: "Gerar conta a receber ao aprovar orçamento",
        type: "boolean",
        defaultValue: "true",
        wide: true,
      },
    ],
  },
  {
    id: "portal",
    label: "Portal empresarial",
    description: "Comportamento do portal para empresas clientes.",
    fields: [
      {
        key: "portal.welcome_message",
        label: "Mensagem de boas-vindas",
        type: "textarea",
        wide: true,
      },
      {
        key: "portal.allow_pre_referral",
        label: "Permitir pré-encaminhamento",
        type: "boolean",
        defaultValue: "true",
      },
      {
        key: "portal.show_exam_catalog",
        label: "Exibir catálogo de exames",
        type: "boolean",
        defaultValue: "true",
      },
    ],
  },
  {
    id: "lgpd",
    label: "LGPD e privacidade",
    description: "Textos legais e políticas de dados.",
    fields: [
      { key: "lgpd.dpo_name", label: "Encarregado (DPO)", type: "text" },
      { key: "lgpd.dpo_email", label: "E-mail do DPO", type: "email" },
      {
        key: "lgpd.privacy_summary",
        label: "Resumo da política de privacidade",
        type: "textarea",
        wide: true,
      },
      {
        key: "lgpd.consent_text",
        label: "Texto de consentimento",
        type: "textarea",
        wide: true,
      },
    ],
  },
];

export function getAllSettingKeys(): string[] {
  return SETTINGS_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
}

export function getSettingFieldByKey(key: string): SettingFieldDef | undefined {
  for (const section of SETTINGS_SECTIONS) {
    const field = section.fields.find((f) => f.key === key);
    if (field) return field;
  }
  return undefined;
}

/**
 * Layout compacto da tela Configurações.
 * Campos omitidos permanecem em SETTINGS_SECTIONS (dados/código preservados).
 *
 * docs.retention_years / docs.lgpd_notice / docs.require_consent:
 * não são lidos pelo fluxo ativo — ocultos na UI até haver uso real.
 */
export const SETTINGS_UI_SECTIONS: {
  id: string;
  label: string;
  fieldKeys: readonly string[];
}[] = [
  {
    id: "clinica",
    label: "Dados da clínica",
    fieldKeys: [
      "clinic.display_name",
      "clinic.legal_name",
      "clinic.cnpj",
      "clinic.email",
      "clinic.phone",
      "clinic.whatsapp",
      "clinic.zip",
      "clinic.city_state",
      "clinic.address",
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    fieldKeys: ["ops.pre_referral_sla_hours"],
  },
  {
    id: "portal",
    label: "Portal empresarial",
    fieldKeys: ["portal.welcome_message", "portal.allow_pre_referral"],
  },
];

export function getSettingsUiFieldKeys(): string[] {
  return SETTINGS_UI_SECTIONS.flatMap((s) => [...s.fieldKeys]);
}

export function settingsUiValuesSnapshot(
  values: Record<string, string>
): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const key of getSettingsUiFieldKeys()) {
    const field = getSettingFieldByKey(key);
    snap[key] = values[key] ?? field?.defaultValue ?? "";
  }
  return snap;
}

export function settingsMapFromRows(
  rows: { key: string; value: string }[],
  defaults: Record<string, string> = {}
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const section of SETTINGS_SECTIONS) {
    for (const field of section.fields) {
      map[field.key] = field.defaultValue ?? defaults[field.key] ?? "";
    }
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (key in map && !map[key]) map[key] = value;
    if (!(key in map)) map[key] = value;
  }

  for (const row of rows) {
    map[row.key] = row.value;
  }

  return map;
}

export function sectionValuesSnapshot(
  sectionId: string,
  values: Record<string, string>
): Record<string, string> {
  const section = SETTINGS_SECTIONS.find((s) => s.id === sectionId);
  const snap: Record<string, string> = {};
  if (!section) return snap;
  for (const field of section.fields) {
    snap[field.key] = values[field.key] ?? field.defaultValue ?? "";
  }
  return snap;
}
