"use client";

import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  LeadDetailSerialized,
  QuoteDetailSerialized,
  ContactDetailSerialized,
} from "@/lib/commercial";
import {
  COMMERCIAL_STAGE_LABELS,
  QUOTE_STATUS_LABELS,
  COMMERCIAL_HISTORY_LABELS,
  FOLLOW_UP_STATUS_LABELS,
  formatCurrency,
  sourceLabel,
} from "@/lib/commercial";
import { CONTACT_MESSAGE_STATUS_LABELS } from "@/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 text-sm text-slate-700">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="min-w-[9rem] shrink-0 font-medium text-slate-600">{label}</span>
      <span className="flex-1 text-slate-800">{value}</span>
    </div>
  );
}

export function LeadDetailContent({ lead }: { lead: LeadDetailSerialized }) {
  const nextFollowUpOverdue =
    !!lead.nextFollowUpAt &&
    isBefore(new Date(lead.nextFollowUpAt), startOfDay(new Date()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="comercial-stage-pill">{COMMERCIAL_STAGE_LABELS[lead.stage]}</span>
        <span className="text-xs text-slate-500">{sourceLabel(lead.source)}</span>
      </div>

      <Section title="Oportunidade">
        <Row label="Empresa / prospect" value={lead.companyName ?? "—"} />
        <Row label="Contato principal" value={lead.name} />
        <Row label="Telefone" value={lead.phone ?? "—"} />
        <Row label="E-mail" value={lead.email ?? "—"} />
        <Row label="Cidade" value={lead.city ?? "—"} />
        <Row label="CNPJ" value={lead.cnpj ?? "—"} />
        <Row
          label="Colaboradores"
          value={lead.estimatedEmployees != null ? String(lead.estimatedEmployees) : "—"}
        />
        <Row label="Interesse" value={lead.serviceInterest ?? lead.subject ?? "—"} />
        <Row label="Origem" value={sourceLabel(lead.source)} />
        <Row label="Responsável" value={lead.assignedToName ?? "—"} />
        <Row label="Etapa" value={COMMERCIAL_STAGE_LABELS[lead.stage]} />
        <Row
          label="Último contato"
          value={
            lead.lastContactAt
              ? format(new Date(lead.lastContactAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
              : "—"
          }
        />
        <Row
          label="Próximo follow-up"
          value={
            lead.nextFollowUpAt ? (
              <span className={cn(nextFollowUpOverdue && "font-semibold text-rose-600")}>
                {format(new Date(lead.nextFollowUpAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                {lead.followUpAction ? ` · ${lead.followUpAction}` : ""}
                {nextFollowUpOverdue ? " (atrasado)" : ""}
              </span>
            ) : (
              "Não agendado"
            )
          }
        />
        {lead.lostReason && <Row label="Motivo da perda" value={lead.lostReason} />}
      </Section>

      {lead.message && (
        <Section title="Observações / mensagem">
          <p className="whitespace-pre-wrap leading-relaxed">{lead.message}</p>
          {lead.sourcePage && <Row label="Página de origem" value={lead.sourcePage} />}
        </Section>
      )}

      <Section title="Propostas vinculadas">
        {lead.quotes.length === 0 ? (
          <p className="text-slate-500">Nenhuma proposta ainda.</p>
        ) : (
          <ul className="space-y-2">
            {lead.quotes.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2 last:border-0">
                <div>
                  <p className="font-medium text-slate-800">{q.quoteNumber}</p>
                  <p className="text-xs text-slate-500">{q.servicesSummary}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatCurrency(q.totalAmount)}</p>
                  <p className="text-xs text-slate-500">{QUOTE_STATUS_LABELS[q.status]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Follow-ups">
        {lead.followUps.length === 0 ? (
          <p className="text-slate-500">Nenhum follow-up registrado.</p>
        ) : (
          <ul className="space-y-2">
            {lead.followUps.map((f) => (
              <li key={f.id} className="border-b border-slate-200/80 pb-2 last:border-0">
                <p className="font-medium text-slate-800">
                  {format(new Date(f.dueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} · {f.action}
                </p>
                <p className="text-xs text-slate-500">
                  {FOLLOW_UP_STATUS_LABELS[f.status]}
                  {f.overdue ? " · atrasado" : ""}
                  {f.assignedToName ? ` · ${f.assignedToName}` : ""}
                </p>
                {f.result && <p className="mt-1 text-sm">{f.result}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {lead.notes.length > 0 && (
        <Section title="Anotações / contatos">
          <ul className="space-y-3">
            {lead.notes.map((n) => (
              <li key={n.id} className="border-b border-slate-200/80 pb-2 last:border-0">
                <p className="whitespace-pre-wrap">{n.content}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {n.createdByName} ·{" "}
                  {format(new Date(n.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {lead.history.length > 0 && (
        <Section title="Linha do tempo">
          <ul className="space-y-2">
            {lead.history.map((h) => (
              <li key={h.id} className="text-sm">
                <span className="font-medium">{COMMERCIAL_HISTORY_LABELS[h.action]}</span>
                {h.fromStatus && h.toStatus && (
                  <span className="text-slate-600">
                    {" "}
                    — {COMMERCIAL_STAGE_LABELS[h.fromStatus as keyof typeof COMMERCIAL_STAGE_LABELS] ?? h.fromStatus}
                    {" → "}
                    {COMMERCIAL_STAGE_LABELS[h.toStatus as keyof typeof COMMERCIAL_STAGE_LABELS] ?? h.toStatus}
                  </span>
                )}
                {h.notes && <span className="text-slate-600"> — {h.notes}</span>}
                <p className="text-xs text-slate-500">
                  {h.performedByName ?? "Sistema"} ·{" "}
                  {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function QuoteDetailContent({ quote }: { quote: QuoteDetailSerialized }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={quote.status} type="quote" />
          <span className="text-sm font-semibold text-slate-600">{quote.quoteNumber}</span>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{quote.companyName}</h2>
      </div>
      <Section title="Proposta">
        <Row label="Responsável" value={quote.responsibleName ?? "—"} />
        <Row label="Telefone" value={quote.phone ?? "—"} />
        <Row label="E-mail" value={quote.email ?? "—"} />
        <Row label="CNPJ" value={quote.cnpj ?? "—"} />
        <Row label="Cidade" value={[quote.city, quote.state].filter(Boolean).join(" / ") || "—"} />
        <Row label="Valor" value={formatCurrency(quote.totalAmount)} />
        <Row
          label="Validade"
          value={
            quote.validUntil
              ? format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })
              : "—"
          }
        />
        <Row label="Criado por" value={quote.createdByName ?? "—"} />
      </Section>
      <Section title="Serviços">
        <ul className="space-y-2">
          {quote.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {item.serviceName}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              </span>
              <span>{formatCurrency(item.totalPrice ?? item.unitPrice)}</span>
            </li>
          ))}
        </ul>
      </Section>
      {quote.notes.length > 0 && (
        <Section title="Observações">
          <ul className="space-y-2">
            {quote.notes.map((n) => (
              <li key={n.id}>
                <p>{n.content}</p>
                <p className="text-xs text-slate-500">
                  {n.createdByName} · {format(new Date(n.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {quote.history.length > 0 && (
        <Section title="Histórico">
          <ul className="space-y-2">
            {quote.history.map((h) => (
              <li key={h.id} className="text-sm">
                <span className="font-medium">{COMMERCIAL_HISTORY_LABELS[h.action]}</span>
                {h.notes && <span className="text-slate-600"> — {h.notes}</span>}
                <p className="text-xs text-slate-500">
                  {h.performedByName ?? "Sistema"} ·{" "}
                  {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function ContactDetailContent({ contact }: { contact: ContactDetailSerialized }) {
  return (
    <div className="space-y-6">
      <StatusBadge status={contact.status} type="contact" />
      <Section title="Contato">
        <Row label="Nome" value={contact.name} />
        <Row label="Empresa" value={contact.company ?? "—"} />
        <Row label="Telefone" value={contact.phone} />
        <Row label="E-mail" value={contact.email ?? "—"} />
        <Row label="Assunto" value={contact.subject} />
        <Row label="Situação" value={CONTACT_MESSAGE_STATUS_LABELS[contact.status]} />
      </Section>
      <Section title="Mensagem">
        <p className="whitespace-pre-wrap">{contact.message}</p>
      </Section>
    </div>
  );
}
