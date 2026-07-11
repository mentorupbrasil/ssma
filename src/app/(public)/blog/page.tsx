import { BlogEmptyState } from "@/components/public/blog/BlogEmptyState";
import { BlogHero } from "@/components/public/blog/BlogHero";
import { BlogPostCard } from "@/components/public/blog/BlogPostCard";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.blog);

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
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

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : [];

  return (
    <>
      <BlogHero whatsappHref={whatsappHref} />

      <section id="artigos" className="blog-listing scroll-mt-[var(--header-height)]">
        <div className="container-page">
          <div className="blog-listing-header">
            <p className="blog-section-eyebrow">Publicações</p>
            <h2 className="blog-section-title">Artigos recentes</h2>
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
