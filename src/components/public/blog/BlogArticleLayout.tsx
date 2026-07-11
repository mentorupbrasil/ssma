import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Clock3 } from "lucide-react";

import { BlogCopyLink } from "@/components/public/blog/BlogCopyLink";
import { BlogPostCard } from "@/components/public/blog/BlogPostCard";
import { getBlogCategoryMeta, getReadingTimeMinutes, type BlogPostSummary } from "@/lib/blog";
import { getSiteUrl } from "@/lib/seo";

type BlogArticleLayoutProps = {
  post: BlogPostSummary;
  related: BlogPostSummary[];
};

export function BlogArticleLayout({ post, related }: BlogArticleLayoutProps) {
  const meta = getBlogCategoryMeta(post.category);
  const Icon = meta.icon;
  const readingTime = getReadingTimeMinutes(`${post.excerpt} ${post.content}`);
  const articleUrl = `${getSiteUrl()}/blog/${post.slug}`;

  return (
    <article className="blog-article">
      <header className="blog-article-header">
        <div className="container-page">
          <Link href="/blog" className="blog-article-back">
            <ArrowLeft className="size-4" aria-hidden />
            Voltar ao blog
          </Link>

          <div className="blog-article-hero-card">
            <div className={`blog-article-hero-accent blog-article-hero-accent--${meta.accent}`}>
              <span className="blog-article-hero-icon" aria-hidden>
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="blog-article-category">{meta.label}</span>
            </div>

            <h1 className="blog-article-title">{post.title}</h1>
            <p className="blog-article-excerpt">{post.excerpt}</p>

            <div className="blog-article-meta">
              <time dateTime={post.publishedAt.toISOString()}>
                {format(post.publishedAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </time>
              <span className="blog-article-meta-dot" aria-hidden />
              <span className="blog-article-reading">
                <Clock3 className="size-4" aria-hidden />
                {readingTime} min de leitura
              </span>
              <BlogCopyLink url={articleUrl} />
            </div>
          </div>
        </div>
      </header>

      <div className="container-page">
        <div className="blog-article-content legal-prose">{formatArticleContent(post.content)}</div>
      </div>

      {related.length > 0 && (
        <section className="blog-related" aria-labelledby="blog-related-title">
          <div className="container-page">
            <div className="blog-related-header">
              <p className="blog-section-eyebrow">Continue lendo</p>
              <h2 id="blog-related-title" className="blog-section-title">
                Artigos relacionados
              </h2>
            </div>
            <div className="blog-related-grid">
              {related.map((item) => (
                <BlogPostCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function formatArticleContent(content: string) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);

  return blocks.map((block, index) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("## ")) {
      return <h2 key={index}>{trimmed.replace(/^##\s+/, "")}</h2>;
    }
    if (trimmed.startsWith("### ")) {
      return <h3 key={index}>{trimmed.replace(/^###\s+/, "")}</h3>;
    }
    return <p key={index}>{trimmed}</p>;
  });
}
