import type { Metadata } from "next";
import { getClinicSiteConfig } from "@/config/clinic";

export function getSiteUrl(): string {
  const url =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export function createPageMetadata(options: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const config = getClinicSiteConfig();
  const siteUrl = getSiteUrl();
  const pageUrl = options.path ? `${siteUrl}${options.path}` : siteUrl;
  const ogTitle = `${options.title} | ${config.clinicName}`;
  const ogImage = `${siteUrl}/brand/unimetra-logo.png`;

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: ogTitle,
      description: options.description,
      url: pageUrl,
      siteName: config.clinicName,
      locale: "pt_BR",
      type: "website",
      images: [{ url: ogImage, alt: `${config.clinicName} — Medicina e Segurança do Trabalho` }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: options.description,
      images: [ogImage],
    },
    ...(options.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const PUBLIC_PAGE_SEO = {
  home: {
    title: "Medicina e Segurança do Trabalho",
    description:
      "Clínica de medicina ocupacional em Imperatriz-MA. Exames admissionais, ASO, PCMSO, encaminhamento online e gestão para empresas.",
    path: "/",
  },
  sobre: {
    title: "Sobre nós",
    description:
      "Conheça a Unimetra, clínica de Medicina e Segurança do Trabalho em Imperatriz-MA, com atendimento empresarial, exames ocupacionais, documentação e suporte ao RH.",
    path: "/sobre",
  },
  servicos: {
    title: "Serviços",
    description:
      "PCMSO, PGR, exames ocupacionais, laudos e programas de saúde e segurança do trabalho para empresas.",
    path: "/servicos",
  },
  exames: {
    title: "Exames e Preparos",
    description:
      "Catálogo de exames ocupacionais com orientações de preparo, prazos e agendamento em Imperatriz.",
    path: "/exames",
  },
  empresas: {
    title: "Empresas",
    description:
      "Soluções em medicina do trabalho para empresas: portal online, encaminhamentos, documentos e gestão de colaboradores.",
    path: "/empresas",
  },
  encaminhamento: {
    title: "Encaminhamento Online",
    description:
      "Encaminhe colaboradores para exames ocupacionais online. Formulário rápido com confirmação imediata.",
    path: "/encaminhamento-online",
  },
  encaminhamentoSucesso: {
    title: "Pré-encaminhamento Enviado",
    description: "Seu pré-encaminhamento foi recebido pela equipe Unimetra.",
    path: "/encaminhamento-online/sucesso",
    noIndex: true,
  },
  contato: {
    title: "Contato",
    description:
      "Fale com a Unimetra em Imperatriz-MA. Orçamento, dúvidas sobre exames ocupacionais e atendimento empresarial.",
    path: "/contato",
  },
  atualizacoes: {
    title: "Atualizações",
    description: "Notícias e conteúdos sobre medicina ocupacional, SST e saúde do trabalho.",
    path: "/atualizacoes",
  },
  privacidade: {
    title: "Política de Privacidade",
    description: "Como a Unimetra trata dados pessoais em conformidade com a LGPD.",
    path: "/politica-de-privacidade",
  },
  termos: {
    title: "Termos de Uso",
    description: "Termos de uso dos serviços e do site da Unimetra.",
    path: "/termos-de-uso",
  },
} as const;
