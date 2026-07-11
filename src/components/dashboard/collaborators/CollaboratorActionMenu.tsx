"use client";

import { Calendar, Eye, FolderOpen, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type CollaboratorActionMenuProps = {
  onViewDetails: () => void;
  onSchedule: () => void;
  onViewDocuments: () => void;
};

export function CollaboratorActionMenu({
  onViewDetails,
  onSchedule,
  onViewDocuments,
}: CollaboratorActionMenuProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent
        className="collaborator-action-menu w-56 p-1.5"
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
            <span className="collaborator-action-hint">Histórico do colaborador</span>
          </span>
        </button>
        <button type="button" className="collaborator-action-item" onClick={onSchedule}>
          <span className="collaborator-action-icon collaborator-action-icon--schedule">
            <Calendar className="h-4 w-4" />
          </span>
          <span>
            <span className="collaborator-action-label">Agendar</span>
            <span className="collaborator-action-hint">Novo agendamento</span>
          </span>
        </button>
        <button type="button" className="collaborator-action-item" onClick={onViewDocuments}>
          <span className="collaborator-action-icon collaborator-action-icon--docs">
            <FolderOpen className="h-4 w-4" />
          </span>
          <span>
            <span className="collaborator-action-label">Ver documentos</span>
            <span className="collaborator-action-hint">ASOs e laudos</span>
          </span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
