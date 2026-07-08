import { prisma } from "@/lib/prisma";
import { ConteudoClient } from "@/components/dashboard/content/ConteudoClient";

export const metadata = { title: "Conteúdo" };

export default async function ConteudoPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, category: true, published: true, publishedAt: true },
  });
  return <ConteudoClient posts={posts} />;
}
