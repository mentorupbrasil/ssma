import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  contextLine?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  contextLine,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "home-section-header",
        align === "center" && "home-section-header--center",
        className
      )}
    >
      {eyebrow && <p className="home-section-eyebrow">{eyebrow}</p>}
      <h2 className="home-section-title">{title}</h2>
      {description && <p className="home-section-lead">{description}</p>}
      {contextLine && <p className="home-section-context">{contextLine}</p>}
    </header>
  );
}
