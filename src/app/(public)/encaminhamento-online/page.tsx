import { getPublicFormExamOptions } from "@/actions/exams";
import { EncaminhamentoOnlinePageClient } from "@/components/public/EncaminhamentoOnlinePageClient";

import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.encaminhamento);

export default async function EncaminhamentoPage() {
  const examOptions = await getPublicFormExamOptions();
  return <EncaminhamentoOnlinePageClient examOptions={examOptions} />;
}
