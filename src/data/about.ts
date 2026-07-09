import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardCheck,
  Eye,
  FileCheck,
  FileText,
  FolderOpen,
  Heart,
  LayoutDashboard,
  Lock,
  Monitor,
  Scale,
  Shield,
  ShieldCheck,
  Stethoscope,
  Target,
  Users,
  Workflow,
} from "lucide-react";

export const ABOUT_HERO_STATS = [
  { label: "Atendimento empresarial", value: "RH" },
  { label: "Documentos ocupacionais", value: "ASO" },
  { label: "Portal para RH", value: "Digital" },
  { label: "Conformidade SST", value: "Legal" },
] as const;

export const ABOUT_FLOATING_TAGS = ["ASO", "PCMSO", "PGR", "Portal"] as const;

export const ABOUT_INSTITUTIONAL_STATS = [
  { icon: Building2, value: "Empresas", label: "Atendimento corporativo" },
  { icon: Stethoscope, value: "Medicina", label: "do Trabalho" },
  { icon: Shield, value: "Segurança", label: "do Trabalho" },
  { icon: Monitor, value: "Portal", label: "empresarial" },
  { icon: FileText, value: "Documentos", label: "ocupacionais" },
  { icon: ClipboardCheck, value: "Exames", label: "e preparos" },
] as const;

export const ABOUT_DELIVERABLES = [
  {
    title: "Medicina do Trabalho",
    text: "Exames clínicos ocupacionais, ASO e programas médicos para acompanhar a saúde dos colaboradores.",
  },
  {
    title: "Segurança do Trabalho",
    text: "Documentação técnica, laudos e suporte para gestão dos riscos ocupacionais.",
  },
  {
    title: "Documentação ocupacional",
    text: "ASO, PCMSO, PGR, LTCAT, PPP e eventos de SST organizados com rigor técnico.",
  },
  {
    title: "Suporte ao RH e portal empresarial",
    text: "Encaminhamento online, acompanhamento de status e centralização documental em um só lugar.",
  },
] as const;

export const ABOUT_TRUST_CHECKLIST = [
  "Atendimento empresarial",
  "Documentação ocupacional organizada",
  "Conformidade SST",
  "Controle de informações sensíveis",
  "Apoio ao RH",
] as const;

export const ABOUT_WHO_CHIPS = [
  "Medicina do Trabalho",
  "Segurança do Trabalho",
  "Atendimento empresarial",
] as const;

export const ABOUT_WORKFLOW_STEPS = [
  {
    step: 1,
    icon: Building2,
    title: "Entendimento da empresa",
    text: "Mapeamos porte, riscos, prazos admissionais e demandas legais da empresa para orientar o fluxo ocupacional.",
  },
  {
    step: 2,
    icon: FileCheck,
    title: "Organização de exames e documentos",
    text: "Estruturamos ASOs, programas, laudos e exames complementares conforme a rotina do RH e a legislação.",
  },
  {
    step: 3,
    icon: Workflow,
    title: "Encaminhamento e acompanhamento",
    text: "Encaminhamentos online, status claros e comunicação objetiva para reduzir retrabalho e atrasos.",
  },
  {
    step: 4,
    icon: ClipboardCheck,
    title: "Entrega documental e suporte",
    text: "Entrega organizada de documentos e suporte contínuo ao RH na gestão da saúde ocupacional.",
  },
] as const;

export type AboutDifferential = {
  icon: LucideIcon;
  title: string;
  text: string;
  accent: string;
};

export const ABOUT_DIFFERENTIALS: AboutDifferential[] = [
  {
    icon: Building2,
    title: "Atendimento orientado à empresa",
    text: "Fluxos pensados para RH e gestores, com linguagem clara e foco em prazos ocupacionais.",
    accent: "navy",
  },
  {
    icon: FileCheck,
    title: "Documentação ocupacional em dia",
    text: "ASO, PCMSO, PGR, LTCAT, PPP e eventos de SST organizados com rigor técnico.",
    accent: "green",
  },
  {
    icon: Workflow,
    title: "Fluxo mais ágil para o RH",
    text: "Menos idas e vindas, mais previsibilidade no acompanhamento de exames e documentos.",
    accent: "teal",
  },
  {
    icon: Stethoscope,
    title: "Estrutura preparada",
    text: "Ambiente adequado para atendimento clínico, exames e suporte às necessidades das empresas.",
    accent: "navy",
  },
  {
    icon: LayoutDashboard,
    title: "Portal empresarial",
    text: "Encaminhamento online, acompanhamento de status e centralização documental em um só lugar.",
    accent: "green",
  },
  {
    icon: ShieldCheck,
    title: "Segurança e conformidade",
    text: "Boas práticas para dados sensíveis, controle de acesso e apoio às obrigações legais de SST.",
    accent: "teal",
  },
];

export const ABOUT_VALUES = [
  {
    icon: Heart,
    title: "Propósito",
    text: "Ajudar empresas a proteger pessoas, reduzir riscos e manter suas obrigações ocupacionais em dia com mais clareza, segurança e confiança.",
    variant: "featured" as const,
  },
  {
    icon: Target,
    title: "Missão",
    text: "Simplificar a gestão de Saúde e Segurança do Trabalho para empresas, unindo atendimento ocupacional, documentação legal e acompanhamento digital.",
    variant: "compact" as const,
  },
  {
    icon: Eye,
    title: "Visão",
    text: "Ser referência regional em Medicina e Segurança do Trabalho pela qualidade do atendimento, organização dos processos e uso inteligente da tecnologia.",
    variant: "compact" as const,
  },
];

export const ABOUT_EXPERTISE = [
  {
    icon: Stethoscope,
    title: "Medicina do Trabalho",
    text: "Exames clínicos ocupacionais, ASO e programas médicos para acompanhar a saúde dos colaboradores.",
    items: [
      "ASO admissional, periódico e demissional",
      "Retorno ao trabalho",
      "Mudança de função",
      "PCMSO",
    ],
  },
  {
    icon: Shield,
    title: "Segurança do Trabalho",
    text: "Documentação técnica, laudos e suporte para gestão dos riscos ocupacionais.",
    items: ["PGR", "LTCAT", "Laudos técnicos", "PPP", "eSocial SST"],
  },
  {
    icon: Users,
    title: "Atendimento empresarial",
    text: "Fluxo organizado para RH, gestores e colaboradores, com suporte presencial e digital.",
    items: [
      "Encaminhamento online",
      "Acompanhamento de status",
      "Portal empresarial",
      "Organização documental",
    ],
  },
];

export const ABOUT_COMPLIANCE = [
  { icon: Scale, title: "Conformidade legal" },
  { icon: FolderOpen, title: "Organização documental" },
  { icon: Lock, title: "Controle de acesso" },
  { icon: ShieldCheck, title: "Dados sensíveis com responsabilidade" },
];

export const ABOUT_CTA_TAGS = ["ASO", "PCMSO", "PGR", "Portal empresarial"] as const;
