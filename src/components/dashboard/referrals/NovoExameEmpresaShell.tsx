"use client";

import type { ReactNode } from "react";
import { PageModule } from "@/components/dashboard/PageModule";
import { useBreadcrumbSegmentLabel } from "@/components/dashboard/BreadcrumbLabelProvider";

export function NovoExameEmpresaShell({ children }: { children: ReactNode }) {
  useBreadcrumbSegmentLabel("encaminhamentos", "Exames");
  useBreadcrumbSegmentLabel("novo", "Nova solicitação");

  return <PageModule className="exames-empresa-novo">{children}</PageModule>;
}
