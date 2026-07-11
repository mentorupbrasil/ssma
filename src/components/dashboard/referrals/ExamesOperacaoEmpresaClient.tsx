"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { Button } from "@/components/ui/button";
import { EMPRESA_EXAMES_BASE_PATH } from "@/lib/empresa-portal";
import { EncaminhamentosClient } from "./EncaminhamentosClient";
import { useBreadcrumbSegmentLabel } from "@/components/dashboard/BreadcrumbLabelProvider";
import type { ComponentProps } from "react";

type ExamesOperacaoEmpresaClientProps = {
  referrals: ComponentProps<typeof EncaminhamentosClient>;
};

export function ExamesOperacaoEmpresaClient({ referrals }: ExamesOperacaoEmpresaClientProps) {
  useBreadcrumbSegmentLabel("encaminhamentos", "Exames");

  return (
    <PageModule className="exames-empresa">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Exames</h1>
          <p className="colaboradores-empresa-subtitle">
            Acompanhe os exames ocupacionais dos colaboradores.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Link href="/dashboard/encaminhamentos/novo">
            <Button variant="brand" size="sm" className="rounded-lg">
              <Plus className="mr-2 h-4 w-4" />
              Solicitar exame
            </Button>
          </Link>
        </div>
      </header>

      <EncaminhamentosClient {...referrals} embedded listPath={EMPRESA_EXAMES_BASE_PATH} />
    </PageModule>
  );
}
