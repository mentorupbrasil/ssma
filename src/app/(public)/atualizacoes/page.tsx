import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/public/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata = { title: "Atualizações" };

export default async function AtualizacoesPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <PageHero
        title="Atualizações"
        description="Notícias sobre saúde ocupacional, segurança do trabalho e a clínica."
      />

      <section className="section-padding">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/atualizacoes/${post.slug}`}>
              <Card className="h-full border-slate-200 transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="pt-6">
                  <Badge variant="secondary" className="mb-3 bg-[#DFF7F0] text-[#0F3D4A]">{post.category}</Badge>
                  <h2 className="text-lg font-semibold text-[#0F3D4A]">{post.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-slate-400">
                    {format(post.publishedAt, "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
