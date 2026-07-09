import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/public/PageHero";
import { PageSection } from "@/components/public/PageSection";
import { Badge } from "@/components/ui/badge";

import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.atualizacoes);

export default async function AtualizacoesPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Conteúdo"
        title="Atualizações"
        description="Notícias sobre saúde ocupacional, segurança do trabalho e novidades da clínica."
      />

      <PageSection>
        {posts.length === 0 ? (
          <div className="page-content-card mx-auto max-w-xl text-center">
            <p className="text-sm font-semibold text-[var(--brand-navy)]">
              Nenhuma publicação disponível no momento
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Em breve compartilharemos conteúdos sobre SST, conformidade legal e novidades do
              portal empresarial.
            </p>
            <Link
              href="/contato"
              className="mt-4 inline-block text-sm font-semibold text-[var(--brand-green)] hover:underline"
            >
              Fale conosco
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/atualizacoes/${post.slug}`} className="group block h-full">
                <article className="page-feature-card h-full">
                  <Badge className="mb-3 w-fit border border-emerald-200/60 bg-emerald-50 text-[var(--brand-navy)] hover:bg-emerald-50">
                    {post.category}
                  </Badge>
                  <h2 className="page-feature-card-title text-base transition group-hover:text-[var(--brand-green)]">
                    {post.title}
                  </h2>
                  <p className="page-feature-card-desc mt-2 line-clamp-3">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {format(post.publishedAt, "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
}
