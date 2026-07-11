import { BlogCategoryNav } from "@/components/public/blog/BlogCategoryNav";
import { BlogEmptyState } from "@/components/public/blog/BlogEmptyState";
import { BlogHero } from "@/components/public/blog/BlogHero";
import { BlogPostCard } from "@/components/public/blog/BlogPostCard";
import { BLOG_CATEGORIES } from "@/data/blog-page";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { resolveBlogCategoryFilter } from "@/lib/blog";
import { prisma } from "@/lib/prisma";
import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.blog);

type BlogPageProps = {
  searchParams: Promise<{ categoria?: string }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { categoria } = await searchParams;
  const activeSlug = categoria && BLOG_CATEGORIES.some((item) => item.slug === categoria) ? categoria : "todos";
  const categoryFilter = resolveBlogCategoryFilter(activeSlug);

  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
      ...(categoryFilter ? { category: categoryFilter } : {}),
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      category: true,
      publishedAt: true,
    },
  });

  const clinic = getClinicInfo();
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de tirar dúvidas sobre SST com a ${clinic.name}.`
  );

  const showFeatured = !categoryFilter && posts.length > 0;
  const featuredPost = showFeatured ? posts[0] : null;
  const gridPosts = showFeatured ? posts.slice(1) : posts;

  const activeCategoryLabel =
    BLOG_CATEGORIES.find((item) => item.slug === activeSlug)?.label ?? "Todos";

  return (
    <>
      <BlogHero whatsappHref={whatsappHref} />
      <BlogCategoryNav activeSlug={activeSlug} />

      <section id="artigos" className="blog-listing scroll-mt-[var(--header-height)]">
        <div className="container-page">
          <div className="blog-listing-header">
            <p className="blog-section-eyebrow">Publicações</p>
            <h2 className="blog-section-title">
              {activeSlug === "todos" ? "Artigos recentes" : activeCategoryLabel}
            </h2>
            <p className="blog-section-lead">
              Conteúdo prático sobre conformidade, exames, documentação e boas práticas para a rotina
              de SST nas empresas.
            </p>
          </div>

          {posts.length === 0 ? (
            <BlogEmptyState />
          ) : (
            <div className="blog-posts-grid">
              {featuredPost && <BlogPostCard post={featuredPost} featured />}
              {gridPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
