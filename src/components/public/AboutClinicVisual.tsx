import Image from "next/image";
import { Building2, FlaskConical, Stethoscope, Users } from "lucide-react";
import { siteMedia } from "@/config/media";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type VisualSlot = {
  key: string;
  src?: string;
  alt: string;
  icon: LucideIcon;
  className: string;
};

const FALLBACK_SLOTS: Omit<VisualSlot, "src">[] = [
  {
    key: "main",
    alt: "Estrutura da clínica",
    icon: Building2,
    className: "about-visual-slot-main",
  },
  {
    key: "exams",
    alt: "Área de exames",
    icon: Stethoscope,
    className: "about-visual-slot-side1",
  },
  {
    key: "lab",
    alt: "Laboratório",
    icon: FlaskConical,
    className: "about-visual-slot-side2",
  },
  {
    key: "team",
    alt: "Atendimento",
    icon: Users,
    className: "about-visual-slot-wide",
  },
];

function VisualPanel({ slot }: { slot: VisualSlot }) {
  const Icon = slot.icon;

  if (slot.src) {
    return (
      <div className={cn("about-visual-panel about-visual-panel-photo", slot.className)}>
        <Image
          src={slot.src}
          alt={slot.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 90vw, 420px"
        />
      </div>
    );
  }

  return (
    <div className={cn("about-visual-panel about-visual-panel-fallback", slot.className)}>
      <div className="about-visual-panel-glow" aria-hidden />
      <Icon className="about-visual-panel-icon" strokeWidth={1.5} aria-hidden />
    </div>
  );
}

export function AboutClinicVisual({ className }: { className?: string }) {
  const galleryImages = siteMedia.gallery.filter((item) => Boolean(item.src));

  const slots: VisualSlot[] = FALLBACK_SLOTS.map((slot, index) => ({
    ...slot,
    src: galleryImages[index]?.src || (index === 0 ? siteMedia.heroImage || undefined : undefined),
    alt: galleryImages[index]?.label || slot.alt,
  }));

  return (
    <div className={cn("about-clinic-visual", className)}>
      <div className="about-clinic-visual-grid">
        {slots.map((slot) => (
          <VisualPanel key={slot.key} slot={slot} />
        ))}
      </div>
    </div>
  );
}
