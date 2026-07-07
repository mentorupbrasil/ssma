import { getClinicInfo } from "@/lib/helpers";

export const metadata = { title: "Política de Privacidade" };

export default function PoliticaPage() {
  const clinic = getClinicInfo();

  return (
    <article className="page-content-offset py-16">
      <div className="prose prose-slate mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-[#0F3D4A]">Política de Privacidade</h1>
        <p className="text-slate-600">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <h2>1. Dados coletados</h2>
        <p>Coletamos dados pessoais e ocupacionais necessários para prestação de serviços de medicina e segurança do trabalho, incluindo: nome, CPF, RG, dados de contato, dados da empresa empregadora, informações sobre exames solicitados e dados de saúde ocupacional básicos.</p>

        <h2>2. Finalidade</h2>
        <p>Os dados são utilizados para agendamento e realização de exames, emissão de documentos ocupacionais (ASO, PCMSO, laudos), comunicação com empresas e colaboradores, cumprimento de obrigações legais e melhoria dos nossos serviços.</p>

        <h2>3. Segurança</h2>
        <p>Adotamos medidas técnicas e administrativas para proteger os dados, incluindo criptografia de senhas, controle de acesso por perfil, logs de auditoria e armazenamento em infraestrutura segura (Neon PostgreSQL com SSL).</p>

        <h2>4. Compartilhamento</h2>
        <p>Os dados podem ser compartilhados com a empresa empregadora, órgãos reguladores quando exigido por lei, e prestadores de serviço essenciais (hospedagem, e-mail), sempre com base legal adequada.</p>

        <h2>5. Direitos do titular</h2>
        <p>Você pode solicitar acesso, correção, exclusão, portabilidade ou revogação do consentimento entrando em contato pelo canal abaixo. Responderemos conforme prazos da LGPD.</p>

        <h2>6. Canal de contato</h2>
        <p>
          Encarregado/DPO: privacidade@{clinic.name.toLowerCase().replace(/\s/g, "")}.com.br<br />
          E-mail: {clinic.email}<br />
          Telefone: {clinic.phone}
        </p>
      </div>
    </article>
  );
}
