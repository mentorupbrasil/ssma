"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { LeadDetailSerialized, QuoteDetailSerialized, ContactDetailSerialized } from "@/lib/commercial";
import {
  LEAD_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  COMMERCIAL_HISTORY_LABELS,
  formatCurrency,
} from "@/lib/commercial";
import { CONTACT_MESSAGE_STATUS_LABELS } from "@/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

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
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={lead.status} type="lead" />
      </div>
      <Section title="Resumo">
        <Row label="Nome" value={lead.name} />
        <Row label="Empresa" value={lead.companyName ?? "—"} />
        <Row label="Telefone/WhatsApp" value={lead.phone ?? "—"} />
        <Row label="E-mail" value={lead.email ?? "—"} />
        <Row label="Assunto" value={lead.subject ?? "—"} />
        <Row label="Serviço de interesse" value={lead.serviceInterest ?? "—"} />
        <Row label="Origem" value={lead.source} />
        <Row label="Data" value={format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} />
        <Row label="Status" value={<StatusBadge status={lead.status} type="lead" />} />
      </Section>
      {lead.message && (
        <Section title="Mensagem recebida">
          <p className="whitespace-pre-wrap leading-relaxed">{lead.message}</p>
          {lead.sourcePage && <Row label="Página de origem" value={lead.sourcePage} />}
        </Section>
      )}
      {lead.notes.length > 0 && (
        <Section title="Observações internas">
          <ul className="space-y-3">
            {lead.notes.map((n) => (
              <li key={n.id} className="border-b border-slate-200/80 pb-2 last:border-0">
                <p>{n.content}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {n.createdByName} · {format(new Date(n.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {lead.history.length > 0 && (
        <Section title="Histórico">
          <ul className="space-y-2">
            {lead.history.map((h) => (
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

export function QuoteDetailContent({ quote }: { quote: QuoteDetailSerialized }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={quote.status} type="quote" />
          <span className="text-sm font-semibold text-slate-600">{quote.quoteNumber}</span>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{quote.companyName}</h2>
        <p className="text-lg font-medium text-[#16A085]">{formatCurrency(quote.totalAmount)}</p>
      </div>
      <Section title="Dados da empresa">
        <Row label="Empresa" value={quote.companyName} />
        <Row label="Responsável" value={quote.responsibleName ?? "—"} />
        <Row label="WhatsApp" value={quote.phone ?? "—"} />
        <Row label="E-mail" value={quote.email ?? "—"} />
        {quote.cnpj && <Row label="CNPJ" value={quote.cnpj} />}
        {(quote.city || quote.state) && (
          <Row label="Cidade/UF" value={[quote.city, quote.state].filter(Boolean).join(" / ")} />
        )}
      </Section>
      <Section title="Itens do orçamento">
        <ul className="space-y-3">
          {quote.items.map((item) => (
            <li key={item.id} className="border-b border-slate-200/80 pb-2 last:border-0">
              <p className="font-medium">{item.serviceName}</p>
              <p className="text-xs text-slate-500">
                Qtd: {item.quantity}
                {item.totalPrice != null && ` · ${formatCurrency(item.totalPrice)}`}
              </p>
              {item.notes && <p className="mt-1 text-slate-600">{item.notes}</p>}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Condições comerciais">
        <Row
          label="Validade"
          value={
            quote.validUntil
              ? format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })
              : "—"
          }
        />
        <Row label="Pagamento" value={quote.paymentTerms ?? "—"} />
        <Row label="Obs. para cliente" value={quote.clientNotes ?? "—"} />
        <Row label="Obs. internas" value={quote.internalNotes ?? "—"} />
      </Section>
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
      <Section title="Resumo">
        <Row label="Nome" value={contact.name} />
        <Row label="Assunto" value={contact.subject} />
        <Row label="Telefone" value={contact.phone} />
        <Row label="Empresa" value={contact.company ?? "—"} />
        <Row label="E-mail" value={contact.email ?? "—"} />
        <Row label="Data" value={format(new Date(contact.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} />
        <Row
          label="Status"
          value={CONTACT_MESSAGE_STATUS_LABELS[contact.status] ?? contact.status}
        />
      </Section>
      <Section title="Mensagem">
        <p className="whitespace-pre-wrap leading-relaxed">{contact.message}</p>
        {contact.serviceInterest && <Row label="Serviço" value={contact.serviceInterest} />}
        {contact.sourcePage && <Row label="Origem" value={contact.sourcePage} />}
      </Section>
    </div>
  );
}
