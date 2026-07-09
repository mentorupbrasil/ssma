import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  FileText,
  Home,
  Info,
  Mail,
  Stethoscope,
} from "lucide-react";

export type PublicNavItem = {
  name: string;
  url: string;
  icon: LucideIcon;
};

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { name: "Início", url: "/", icon: Home },
  { name: "Sobre", url: "/sobre", icon: Info },
  { name: "Serviços", url: "/servicos", icon: Briefcase },
  { name: "Exames", url: "/exames", icon: Stethoscope },
  { name: "Empresas", url: "/empresas", icon: Building2 },
  { name: "Encaminhamento", url: "/encaminhamento-online", icon: FileText },
  { name: "Contato", url: "/contato", icon: Mail },
];

export function isPublicNavActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}
