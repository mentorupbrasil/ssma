"use client";

import { DollarSign, Eye, FileText, Globe, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type CompanyActionMenuProps = {
  onViewDetails: () => void;
  onCreateAttendance?: () => void;
  onNewQuote?: () => void;
  onManagePortal: () => void;
};

export function CompanyActionMenu({
  onViewDetails,
  onCreateAttendance,
  onNewQuote,
  onManagePortal,
}: CompanyActionMenuProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={(e) => e.stopPropagation()}
            aria-label="Ações da empresa"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent
        className="collaborator-action-menu w-60 p-1.5"
        align="end"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="collaborator-action-item" onClick={onViewDetails}>
          <span className="collaborator-action-icon collaborator-action-icon--view">
            <Eye className="h-4 w-4" />
          </span>
          <span>
            <span className="collaborator-action-label">Ver detalhes</span>
            <span className="collaborator-action-hint">Perfil completo da empresa</span>
          </span>
        </button>

        {onCreateAttendance && (
          <button type="button" className="collaborator-action-item" onClick={onCreateAttendance}>
            <span className="collaborator-action-icon collaborator-action-icon--schedule">
              <FileText className="h-4 w-4" />
            </span>
            <span>
              <span className="collaborator-action-label">Criar atendimento</span>
              <span className="collaborator-action-hint">Novo exame ocupacional</span>
            </span>
          </button>
        )}

        {onNewQuote && (
          <button type="button" className="collaborator-action-item" onClick={onNewQuote}>
            <span className="collaborator-action-icon collaborator-action-icon--quote">
              <DollarSign className="h-4 w-4" />
            </span>
            <span>
              <span className="collaborator-action-label">Novo orçamento</span>
              <span className="collaborator-action-hint">Proposta comercial</span>
            </span>
          </button>
        )}

        <button type="button" className="collaborator-action-item" onClick={onManagePortal}>
          <span className="collaborator-action-icon collaborator-action-icon--portal">
            <Globe className="h-4 w-4" />
          </span>
          <span>
            <span className="collaborator-action-label">Gerenciar portal</span>
            <span className="collaborator-action-hint">Acesso do RH da empresa</span>
          </span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
