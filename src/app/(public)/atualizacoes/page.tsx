import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
      <section className="bg-[#0F3D4A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">Atualizações</h1>
          <p className="mt-4 text-lg text-slate-300">Notícias sobre saúde ocupacional, segurança do trabalho e a clínica.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6 lg:px-8">
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
