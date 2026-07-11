import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History } from "lucide-react";
import type { CollaboratorDetailSerialized } from "@/lib/collaborators";
import { PATIENT_HISTORY_ACTION_LABELS } from "@/lib/collaborators";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type CollaboratorDetailDrawerContentProps = {
  collaborator: CollaboratorDetailSerialized;
};

export function CollaboratorDetailDrawerContent({
  collaborator,
}: CollaboratorDetailDrawerContentProps) {
  return (
    <div className="collaborator-history-panel">
      <div className="collaborator-history-head">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={collaborator.status} type="collaborator" />
          {collaborator.jobTitle && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {collaborator.jobTitle}
            </span>
          )}
        </div>
        <p className="collaborator-history-subtitle">
          Linha do tempo de cadastro, atendimentos, exames e documentos.
        </p>
      </div>

      {collaborator.history.length === 0 ? (
        <div className="collaborator-history-empty">
          <History className="h-8 w-8 text-slate-300" />
          <p>Nenhum registro no histórico ainda.</p>
        </div>
      ) : (
        <ul className="collaborator-history-list">
          {collaborator.history.map((item, index) => (
            <li key={item.id} className="collaborator-history-item">
              <div className="collaborator-history-marker" aria-hidden>
                <span className="collaborator-history-dot" />
                {index < collaborator.history.length - 1 && (
                  <span className="collaborator-history-line" />
                )}
              </div>
              <div className="collaborator-history-card">
                <div className="collaborator-history-card-head">
                  <p className="collaborator-history-title">
                    {PATIENT_HISTORY_ACTION_LABELS[item.action] ?? item.action}
                  </p>
                  <time className="collaborator-history-date">
                    {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </time>
                </div>
                {item.performedByName && (
                  <p className="collaborator-history-meta">Por {item.performedByName}</p>
                )}
                {item.notes && <p className="collaborator-history-notes">{item.notes}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
