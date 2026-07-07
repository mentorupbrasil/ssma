import Image from "next/image";
import { ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaPlaceholderProps = {
  label: string;
  hint?: string;
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
  hint = "Adicione a imagem em /public/images/",
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
          "relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100",
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
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-6 text-center",
        !fill && aspectMap[variant],
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/80">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}
