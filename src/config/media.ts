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
  testimonials: [
    {
      quote:
        "O portal facilitou muito o dia a dia do RH. Encaminhamos colaboradores online e acompanhamos o status sem precisar ligar toda hora.",
      name: "Nome do responsável",
      role: "Gerente de RH",
      company: "Empresa parceira",
      photo: "",
      logo: "",
    },
    {
      quote:
        "Atendimento ágil e equipe que entende de conformidade. Nos ajudou a organizar exames admissionais e periódicos.",
      name: "Nome do responsável",
      role: "Diretora Administrativa",
      company: "Empresa parceira",
      photo: "",
      logo: "",
    },
    {
      quote:
        "Estrutura confortável e processo digital que reduziu retrabalho na nossa operação.",
      name: "Nome do responsável",
      role: "Coordenador de SST",
      company: "Empresa parceira",
      photo: "",
      logo: "",
    },
  ],
  clientLogos: ["", "", "", "", ""],
} as const;
