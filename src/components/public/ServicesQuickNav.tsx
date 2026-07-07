import { cn } from "@/lib/utils";

type ServicesQuickNavProps = {
  items: { id: string; label: string }[];
  className?: string;
};

export function ServicesQuickNav({ items, className }: ServicesQuickNavProps) {
  return (
    <nav
      className={cn("services-quick-nav", className)}
      aria-label="Categorias de serviços"
    >
      <div className="container-page">
        <ul className="services-quick-nav-list">
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="services-quick-nav-chip">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
