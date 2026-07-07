import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  return { title: post?.title ?? "Post" };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) notFound();

  return (
    <article className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/atualizacoes">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
        <Badge className="mb-4 bg-[#DFF7F0] text-[#0F3D4A]">{post.category}</Badge>
        <h1 className="text-4xl font-bold text-[#0F3D4A]">{post.title}</h1>
        <p className="mt-4 text-sm text-slate-500">
          {format(post.publishedAt, "d 'de' MMMM, yyyy", { locale: ptBR })}
        </p>
        <div className="prose prose-slate mt-8 max-w-none">
          <p className="text-lg text-slate-600">{post.excerpt}</p>
          <p className="mt-6 whitespace-pre-wrap text-slate-700">{post.content}</p>
        </div>
      </div>
    </article>
  );
}
