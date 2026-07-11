"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Plus, FileText, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EmpresaExamesTab } from "@/lib/empresa-portal";
import { EMPRESA_EXAMES_BASE_PATH } from "@/lib/empresa-portal";
import { EncaminhamentosClient } from "./EncaminhamentosClient";
import { AgendaClient } from "@/components/dashboard/appointments/AgendaClient";
import type { ComponentProps } from "react";

type ExamesOperacaoEmpresaClientProps = {
  activeTab: EmpresaExamesTab;
  referrals?: ComponentProps<typeof EncaminhamentosClient>;
  agenda?: ComponentProps<typeof AgendaClient>;
};

const TABS: { id: EmpresaExamesTab; label: string; hint: string; icon: typeof FileText }[] = [
  {
    id: "solicitacoes",
    label: "Solicitações",
    hint: "Pedidos enviados à clínica",
    icon: FileText,
  },
  {
    id: "agenda",
    label: "Agenda confirmada",
    hint: "Datas já marcadas pela clínica",
    icon: CalendarDays,
  },
];

export function ExamesOperacaoEmpresaClient({
  activeTab,
  referrals,
  agenda,
}: ExamesOperacaoEmpresaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setTab = (tab: EmpresaExamesTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (tab === "solicitacoes") {
      [
        "date",
        "view",
        "patientId",
        "professionalId",
        "roomName",
      ].forEach((key) => params.delete(key));
    } else {
      ["page", "status", "clinicalExamType", "dateFrom", "dateTo", "id"].forEach((key) =>
        params.delete(key)
      );
      if (!params.get("date")) {
        params.set("date", new Date().toISOString().slice(0, 10));
      }
      if (!params.get("view")) params.set("view", "week");
    }
    startTransition(() => {
      router.push(`/dashboard/encaminhamentos?${params.toString()}`);
    });
  };

  return (
    <PageModule>
      <PageHeader
        title="Exames ocupacionais"
        description="Solicite exames para sua equipe e acompanhe o status até o agendamento confirmado pela clínica."
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
          <strong>Solicitações</strong> é onde você envia pedidos (admissional, periódico, demissional).
          Quando a clínica confirmar data e horário, o exame aparece em <strong>Agenda confirmada</strong>.
        </p>
      </div>

      <div className="exames-operacao-tabs" role="tablist" aria-label="Exames ocupacionais">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn("exames-operacao-tab", isActive && "exames-operacao-tab--active")}
              onClick={() => setTab(tab.id)}
              disabled={pending}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="exames-operacao-tab-copy">
                <span className="exames-operacao-tab-label">{tab.label}</span>
                <span className="exames-operacao-tab-hint">{tab.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="exames-operacao-panel" role="tabpanel">
        {activeTab === "solicitacoes" && referrals ? (
          <EncaminhamentosClient {...referrals} embedded listPath={EMPRESA_EXAMES_BASE_PATH} />
        ) : activeTab === "agenda" && agenda ? (
          <AgendaClient {...agenda} embedded listPath={EMPRESA_EXAMES_BASE_PATH} />
        ) : null}
      </div>
    </PageModule>
  );
}
