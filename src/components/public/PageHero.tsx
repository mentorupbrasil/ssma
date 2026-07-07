import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  description?: string;
  supportingText?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
  layout?: "split" | "stack";
};

export function PageHero({
  title,
  description,
  supportingText,
  eyebrow,
  children,
  className,
  layout = "split",
}: PageHeroProps) {
  const isStacked = layout === "stack";

  return (
    <section
      className={cn(
        "page-hero-offset scroll-mt-[var(--header-height)] relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-[var(--brand-navy)] via-[#124a5a] to-[#0f3d4a]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,160,133,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60" />
      <div className="container-page relative pb-10 pt-1 md:pb-11 lg:pb-12">
        {eyebrow && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            {eyebrow}
          </p>
        )}
        {isStacked ? (
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200/95 sm:text-lg">
                {description}
              </p>
            )}
            {supportingText && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300/90 sm:text-[0.9375rem]">
                {supportingText}
              </p>
            )}
            {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                {title}
              </h1>
              {description && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  {description}
                </p>
              )}
              {supportingText && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300/90 sm:text-[0.9375rem]">
                  {supportingText}
                </p>
              )}
            </div>
            {children && <div className="flex shrink-0 flex-wrap gap-3">{children}</div>}
          </div>
        )}
      </div>
    </section>
  );
}
