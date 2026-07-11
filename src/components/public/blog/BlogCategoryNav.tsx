import Link from "next/link";

import { BLOG_CATEGORIES } from "@/data/blog-page";
import { blogCategoryHref } from "@/lib/blog";
import { cn } from "@/lib/utils";

type BlogCategoryNavProps = {
  activeSlug: string;
};

export function BlogCategoryNav({ activeSlug }: BlogCategoryNavProps) {
  return (
    <nav className="blog-category-nav scroll-mt-[var(--header-height)]" aria-label="Filtrar por categoria">
      <div className="container-page">
        <ul className="blog-category-nav-list">
          {BLOG_CATEGORIES.map((category) => {
            const isActive = category.slug === activeSlug;
            return (
              <li key={category.slug}>
                <Link
                  href={blogCategoryHref(category.slug)}
                  className={cn("blog-category-chip", isActive && "blog-category-chip--active")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {category.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
