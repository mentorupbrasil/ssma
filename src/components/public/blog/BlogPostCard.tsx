import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpRight, Clock3 } from "lucide-react";

import { getBlogCategoryMeta, getReadingTimeMinutes, type BlogPostSummary } from "@/lib/blog";
import { cn } from "@/lib/utils";

type BlogPostCardProps = {
  post: BlogPostSummary;
  featured?: boolean;
};

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const meta = getBlogCategoryMeta(post.category);
  const Icon = meta.icon;
  const readingTime = getReadingTimeMinutes(`${post.excerpt} ${post.content}`);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn("blog-post-card group", featured && "blog-post-card--featured")}
    >
      <article className="blog-post-card-inner">
        <div className={cn("blog-post-card-visual", `blog-post-card-visual--${meta.accent}`)}>
          <div className="blog-post-card-visual-glow" aria-hidden />
          <span className="blog-post-card-icon" aria-hidden>
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <span className="blog-post-card-category">{meta.label}</span>
        </div>

        <div className="blog-post-card-body">
          <div className="blog-post-card-meta">
            <time dateTime={post.publishedAt.toISOString()}>
              {format(post.publishedAt, "d 'de' MMM. yyyy", { locale: ptBR })}
            </time>
            <span className="blog-post-card-meta-dot" aria-hidden />
            <span className="blog-post-card-reading">
              <Clock3 className="size-3.5" aria-hidden />
              {readingTime} min
            </span>
          </div>

          <h2 className="blog-post-card-title">{post.title}</h2>
          <p className="blog-post-card-excerpt">{post.excerpt}</p>

          <span className="blog-post-card-link">
            Ler artigo
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
