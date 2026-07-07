import Image from "next/image";
import { ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaPlaceholderProps = {
  label: string;
  src?: string;
  alt?: string;
  variant?: "photo" | "video" | "logo" | "avatar";
  className?: string;
  fill?: boolean;
};

const aspectMap = {
  photo: "aspect-[4/3]",
  video: "aspect-video",
  logo: "aspect-[3/2]",
  avatar: "aspect-square",
};

export function MediaPlaceholder({
  label,
  src,
  alt,
  variant = "photo",
  className,
  fill = false,
}: MediaPlaceholderProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm",
          !fill && aspectMap[variant],
          className
        )}
      >
        <Image
          src={src}
          alt={alt ?? label}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    );
  }

  const Icon = variant === "video" ? Video : ImageIcon;

  return (
    <div
      className={cn(
        "media-placeholder flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-6 text-center shadow-sm",
        !fill && aspectMap[variant],
        className
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <Icon className="h-5 w-5 text-[var(--brand-green)]" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-[var(--brand-navy)]">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Conteúdo visual em preparação</p>
    </div>
  );
}
