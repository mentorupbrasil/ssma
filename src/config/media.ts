/**
 * Caminhos de mídia do site público.
 * Preencha com arquivos em /public/images/... quando tiver as fotos prontas.
 * Ex.: hero: "/images/hero/recepcao.jpg"
 */
export const siteMedia = {
  heroImage: "",
  heroVideo: "",
  aboutTeam: [
    { name: "Nome do responsável", role: "Direção / Medicina do Trabalho", src: "" },
    { name: "Nome do profissional", role: "Coordenação de SST", src: "" },
    { name: "Nome do profissional", role: "Recepção e atendimento", src: "" },
  ],
  gallery: [
    { label: "Recepção", src: "" },
    { label: "Consultório", src: "" },
    { label: "Laboratório", src: "" },
    { label: "Sala de exames", src: "" },
  ],
  /** Depoimentos reais — preencher quando houver conteúdo aprovado para publicação. */
  testimonials: [] as {
    quote: string;
    name: string;
    role: string;
    company: string;
    photo: string;
    logo: string;
  }[],
  /** Logos de clientes — preencher apenas com autorização para exibição pública. */
  clientLogos: [] as string[],
} as const;
