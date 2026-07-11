import {
  BookOpen,
  Building2,
  FileText,
  HeartPulse,
  Lightbulb,
  Scale,
  Shield,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  publishedAt: Date;
};

export type BlogCategoryAccent = "blue" | "violet" | "amber" | "slate" | "emerald";

export type BlogCategoryMeta = {
  label: string;
  accent: BlogCategoryAccent;
  icon: LucideIcon;
};

const CATEGORY_META: Record<string, BlogCategoryMeta> = {
  "Saúde ocupacional": { label: "Saúde ocupacional", accent: "emerald", icon: HeartPulse },
  "Exames ocupacionais": { label: "Exames ocupacionais", accent: "blue", icon: Stethoscope },
  "Segurança do trabalho": { label: "Segurança do trabalho", accent: "amber", icon: Shield },
  "Medicina do trabalho": { label: "Medicina do trabalho", accent: "violet", icon: FileText },
  "Normas e legislação": { label: "Normas e legislação", accent: "blue", icon: Scale },
  Dicas: { label: "Dicas", accent: "amber", icon: Lightbulb },
  Institucional: { label: "Institucional", accent: "slate", icon: Building2 },
  Atualizações: { label: "Atualizações", accent: "violet", icon: FileText },
};

const DEFAULT_CATEGORY_META: BlogCategoryMeta = {
  label: "Conteúdo",
  accent: "blue",
  icon: BookOpen,
};

export function getBlogCategoryMeta(category: string): BlogCategoryMeta {
  return CATEGORY_META[category] ?? { ...DEFAULT_CATEGORY_META, label: category };
}

export function getReadingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
