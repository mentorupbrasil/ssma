import { notFound } from "next/navigation";

import { BlogArticleLayout } from "@/components/public/blog/BlogArticleLayout";
import { BLOG_POST_SELECT } from "@/lib/blog-queries";
import { prisma } from "@/lib/prisma";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.published) return { title: "Artigo" };

  return createPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });

  if (!post || !post.published) notFound();

  const related = await prisma.blogPost.findMany({
    where: {
      published: true,
      slug: { not: post.slug },
      category: post.category,
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: BLOG_POST_SELECT,
  });

  const fallbackRelated =
    related.length > 0
      ? related
      : await prisma.blogPost.findMany({
          where: {
            published: true,
            slug: { not: post.slug },
          },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: BLOG_POST_SELECT,
        });

  return <BlogArticleLayout post={post} related={fallbackRelated} />;
}
