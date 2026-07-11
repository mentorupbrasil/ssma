import dotenv from "dotenv";

dotenv.config({ override: true });

import { PrismaClient } from "@prisma/client";
import { BLOG_POSTS } from "../src/data/blog-posts";

const prisma = new PrismaClient();

async function main() {
  const slugs = BLOG_POSTS.map((post) => post.slug);

  for (const post of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        coverImage: post.coverImage,
        published: true,
        publishedAt: new Date(post.publishedAt),
      },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        coverImage: post.coverImage,
        published: true,
        publishedAt: new Date(post.publishedAt),
      },
    });
    console.log(`✓ ${post.slug}`);
  }

  const removed = await prisma.blogPost.deleteMany({
    where: { slug: { notIn: slugs } },
  });

  if (removed.count > 0) {
    console.log(`Removidos ${removed.count} artigo(s) fora do catálogo atual.`);
  }

  console.log(`\n${BLOG_POSTS.length} artigos sincronizados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
