"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
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
      <PageHeader
        title="Exames ocupacionais"
        description="Encaminhe colaboradores para a clínica e acompanhe até o ASO ficar disponível para download."
      >
        <Link href="/dashboard/encaminhamentos/novo">
          <Button variant="brand">
            <Plus className="mr-2 h-4 w-4" />
            Solicitar exames
          </Button>
        </Link>
      </PageHeader>

      <div className="exames-operacao-intro">
        <p>
          <strong>Encaminhou?</strong> Pronto. O colaborador comparece à clínica quando puder — não
          precisa de confirmação de agenda. A Unimetra realiza o exame, anexa o ASO e você baixa em{" "}
          <strong>ASOs e documentos</strong>.
        </p>
      </div>

      <EncaminhamentosClient {...referrals} embedded listPath={EMPRESA_EXAMES_BASE_PATH} />
    </PageModule>
  );
}
