import { getPublicFormExamOptions } from "@/actions/exams";
import { EncaminhamentoOnlinePageClient } from "@/components/public/EncaminhamentoOnlinePageClient";

export const metadata = { title: "Encaminhamento Online" };

export default async function EncaminhamentoPage() {
  const examOptions = await getPublicFormExamOptions();
  return <EncaminhamentoOnlinePageClient examOptions={examOptions} />;
}
