import { getClinicInfo } from "@/lib/helpers";
import { PageHero } from "@/components/public/PageHero";
import { PageSection } from "@/components/public/PageSection";

export const metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  const clinic = getClinicInfo();

  return (
    <>
      <PageHero eyebrow="Legal" title="Termos de Uso" description="Condições de uso do site e do portal empresarial." />
      <PageSection variant="white">
        <div className="legal-prose mx-auto max-w-3xl">
          <p className="legal-updated">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          <h2>1. Aceitação</h2>
          <p>Ao utilizar o site e o painel da {clinic.name}, você concorda com estes termos.</p>
          <h2>2. Serviços</h2>
          <p>
            A plataforma oferece informações institucionais, formulários de contato, encaminhamento
            online e painel de gestão para empresas e colaboradores da clínica.
          </p>
          <h2>3. Responsabilidades do usuário</h2>
          <p>
            O usuário é responsável pela veracidade dos dados informados, pela confidencialidade de
            suas credenciais de acesso e pelo uso adequado da plataforma.
          </p>
          <h2>4. Limitações</h2>
          <p>
            Este sistema não substitui consulta médica. Resultados e laudos devem ser interpretados
            por profissionais habilitados.
          </p>
          <h2>5. Propriedade intelectual</h2>
          <p>
            Todo o conteúdo, design e código da plataforma são de propriedade da {clinic.name} ou
            licenciados para seu uso.
          </p>
          <h2>6. Alterações</h2>
          <p>Reservamo-nos o direito de alterar estes termos a qualquer momento, com publicação nesta página.</p>
          <h2>7. Contato</h2>
          <p>
            {clinic.email && <>E-mail: {clinic.email}<br /></>}
            {clinic.phone && <>Telefone: {clinic.phone}</>}
            {!clinic.email && !clinic.phone && (
              <>Entre em contato pelo formulário disponível em /contato.</>
            )}
          </p>
        </div>
      </PageSection>
    </>
  );
}
