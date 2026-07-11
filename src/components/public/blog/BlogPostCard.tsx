import Link from "next/link";
import Image from "next/image";
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
  const readingTime = getReadingTimeMinutes(`${post.excerpt} ${post.content}`);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn("blog-post-card group", featured && "blog-post-card--featured")}
    >
      <article className="blog-post-card-inner">
        <div className={cn("blog-post-card-cover", featured && "blog-post-card-cover--featured")}>
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={`Ilustração: ${post.title}`}
              fill
              priority={featured}
              sizes={featured ? "(min-width: 900px) 42vw, 100vw" : "(min-width: 1100px) 33vw, (min-width: 768px) 50vw, 100vw"}
              className="blog-post-card-cover-img"
            />
          ) : (
            <div className={cn("blog-post-card-cover-fallback", `blog-post-card-cover-fallback--${meta.accent}`)} />
          )}
          <div className="blog-post-card-cover-overlay" aria-hidden />
          <span className="blog-post-card-cover-category">{meta.label}</span>
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
