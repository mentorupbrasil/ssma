"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { Button } from "@/components/ui/button";
import { EMPRESA_EXAMES_BASE_PATH } from "@/lib/empresa-portal";
import { EncaminhamentosClient } from "./EncaminhamentosClient";
import type { ComponentProps } from "react";

type ExamesOperacaoEmpresaClientProps = {
  referrals: ComponentProps<typeof EncaminhamentosClient>;
};

export function ExamesOperacaoEmpresaClient({ referrals }: ExamesOperacaoEmpresaClientProps) {
  return (
    <PageModule>
      <div className="exames-empresa-actions">
        <Link href="/dashboard/encaminhamentos/novo">
          <Button variant="brand">
            <Plus className="mr-2 h-4 w-4" />
            Agendar exames
          </Button>
        </Link>
      </div>

      <EncaminhamentosClient {...referrals} embedded listPath={EMPRESA_EXAMES_BASE_PATH} />
    </PageModule>
  );
}
