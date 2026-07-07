import { getClinicInfo } from "@/lib/helpers";
import { PageHero } from "@/components/public/PageHero";
import { PageSection } from "@/components/public/PageSection";

export const metadata = { title: "Política de Privacidade" };

export default function PoliticaPage() {
  const clinic = getClinicInfo();

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Política de Privacidade"
        description="Como tratamos dados pessoais e ocupacionais em conformidade com a LGPD."
      />
      <PageSection variant="white">
        <div className="legal-prose mx-auto max-w-3xl">
          <p className="legal-updated">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          <h2>1. Dados coletados</h2>
          <p>
            Coletamos dados pessoais e ocupacionais necessários para prestação de serviços de
            medicina e segurança do trabalho, incluindo: nome, CPF, RG, dados de contato, dados da
            empresa empregadora, informações sobre exames solicitados e dados de saúde ocupacional
            básicos.
          </p>
          <h2>2. Finalidade</h2>
          <p>
            Os dados são utilizados para agendamento e realização de exames, emissão de documentos
            ocupacionais (ASO, PCMSO, laudos), comunicação com empresas e colaboradores,
            cumprimento de obrigações legais e melhoria dos nossos serviços.
          </p>
          <h2>3. Segurança</h2>
          <p>
            Adotamos medidas técnicas e administrativas para proteger os dados, incluindo criptografia
            de senhas, controle de acesso por perfil, logs de auditoria e armazenamento em
            infraestrutura segura.
          </p>
          <h2>4. Compartilhamento</h2>
          <p>
            Os dados podem ser compartilhados com a empresa empregadora, órgãos reguladores quando
            exigido por lei, e prestadores de serviço essenciais, sempre com base legal adequada.
          </p>
          <h2>5. Direitos do titular</h2>
          <p>
            Você pode solicitar acesso, correção, exclusão, portabilidade ou revogação do
            consentimento entrando em contato pelos canais abaixo. Responderemos conforme prazos da
            LGPD.
          </p>
          <h2>6. Canal de contato</h2>
          <p>
            {clinic.email && <>E-mail: {clinic.email}<br /></>}
            {clinic.phone && <>Telefone: {clinic.phone}<br /></>}
            {!clinic.email && !clinic.phone && (
              <>Utilize o formulário em /contato para solicitações relacionadas à privacidade.</>
            )}
          </p>
        </div>
      </PageSection>
    </>
  );
}
