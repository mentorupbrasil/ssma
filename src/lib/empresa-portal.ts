import { COLLABORATOR_STAT_CARDS } from "@/lib/collaborators";
import { APPOINTMENT_STAT_CARDS } from "@/lib/appointments";
import { DOCUMENT_STAT_CARDS } from "@/lib/documents";
import { TICKET_STAT_CARDS } from "@/lib/tickets";
import { isCompanyHr } from "@/lib/tenant";
import type { UserRole } from "@/types/roles";

export function isEmpresaPortalRole(role: UserRole): boolean {
  return isCompanyHr(role);
}

/** Itens ocultos no menu lateral do RH */
export const EMPRESA_HIDDEN_NAV_HREFS = ["/dashboard/pre-encaminhamentos"];

export const EMPRESA_NAV_SECTIONS = [
  { label: "Geral", hrefs: ["/dashboard"] },
  {
    label: "Operação",
    hrefs: [
      "/dashboard/colaboradores",
      "/dashboard/encaminhamentos",
      "/dashboard/agenda",
      "/dashboard/documentos",
      "/dashboard/exames",
    ],
  },
  { label: "Suporte", hrefs: ["/dashboard/chamados"] },
] as const;

export function collaboratorStatCardsForEmpresa() {
  return COLLABORATOR_STAT_CARDS.filter((c) => c.key !== "sem_empresa");
}

export function appointmentStatCardsForEmpresa() {
  return APPOINTMENT_STAT_CARDS.filter((c) => c.key !== "em_atendimento");
}

export function documentStatCardsForEmpresa() {
  return DOCUMENT_STAT_CARDS.filter(
    (c) => !["em_emissao", "asos_pendentes"].includes(c.key)
  );
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
