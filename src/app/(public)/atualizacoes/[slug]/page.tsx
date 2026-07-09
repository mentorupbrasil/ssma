import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageSection } from "@/components/public/PageSection";

import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: "Post" };
  return createPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/atualizacoes/${post.slug}`,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) notFound();

  return (
    <PageSection className="!pt-8 md:!pt-10">
      <article className="mx-auto max-w-3xl">
        <Link href="/atualizacoes">
          <Button variant="ghost" size="sm" className="mb-5 rounded-lg">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
        <Badge className="mb-4 border border-emerald-200/60 bg-emerald-50 text-[var(--brand-navy)] hover:bg-emerald-50">
          {post.category}
        </Badge>
        <h1 className="text-3xl font-bold leading-tight text-[var(--brand-navy)] sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {format(post.publishedAt, "d 'de' MMMM, yyyy", { locale: ptBR })}
        </p>
        <div className="legal-prose mt-8 border-t border-slate-100 pt-8">
          <p className="text-lg text-slate-600">{post.excerpt}</p>
          <p className="mt-6 whitespace-pre-wrap">{post.content}</p>
        </div>
      </article>
    </PageSection>
  );
}
