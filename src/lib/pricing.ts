import type { PriceItemCategory, PriceChargeType, PriceListStatus } from "@prisma/client";

export const PRICE_CATEGORY_LABELS: Record<PriceItemCategory, string> = {
  EXAME: "Exame",
  ASO: "ASO",
  SERVICO: "Serviço",
  PACOTE: "Pacote",
  LAUDO: "Laudo",
  OUTRO: "Outro",
};

export const PRICE_CHARGE_LABELS: Record<PriceChargeType, string> = {
  AVULSA: "Avulsa",
  MENSAL: "Mensal",
  PACOTE: "Pacote",
  CONTRATO: "Contrato",
  CONVENIO: "Convênio",
};

export const PRICE_STATUS_LABELS: Record<PriceListStatus, string> = {
  ATIVA: "Ativa",
  INATIVA: "Inativa",
  VENCIDA: "Vencida",
};

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function normalizeCnpj(cnpj: string) {
  return cnpj.replace(/\D/g, "");
}

export function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export function effectivePrice(item: { defaultPrice: number; negotiatedPrice: number | null; companyId: string | null }) {
  if (item.companyId && item.negotiatedPrice != null) return item.negotiatedPrice;
  return item.defaultPrice;
}

export type PriceLookupInput = {
  serviceName: string;
  companyId?: string | null;
  examType?: string | null;
};

export function buildPriceSearchTerms(input: PriceLookupInput) {
  const terms = [input.serviceName.trim()];
  if (input.examType?.trim()) terms.push(input.examType.trim());
  return terms.filter(Boolean);
}
