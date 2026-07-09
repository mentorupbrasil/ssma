import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/sobre",
  "/servicos",
  "/exames",
  "/empresas",
  "/encaminhamento-online",
  "/contato",
  "/atualizacoes",
  "/politica-de-privacidade",
  "/termos-de-uso",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    blogEntries = posts.map((post) => ({
      url: `${siteUrl}/atualizacoes/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    /* banco indisponível no build — rotas estáticas ainda entram no sitemap */
  }

  return [...staticEntries, ...blogEntries];
}
