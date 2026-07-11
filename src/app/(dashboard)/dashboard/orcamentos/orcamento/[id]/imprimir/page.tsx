import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-auth";
import { formatCurrency } from "@/lib/commercial";
import { getClinicInfo } from "@/lib/helpers";
import { PrintQuoteButton } from "@/components/dashboard/commercial/PrintQuoteButton";

export default async function QuotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("leads.manage");
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!quote) notFound();

  const clinic = getClinicInfo();
  const hasAmount = quote.totalAmount != null && quote.totalAmount > 0;

  return (
    <div className="quote-print-page">
      <style>{`
        .quote-print-page { font-family: system-ui, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 2rem; }
        .quote-print-page h1 { color: #0F3D4A; font-size: 1.5rem; margin-bottom: 0.25rem; }
        .quote-print-page .header { border-bottom: 2px solid #16A085; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .quote-print-page .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; font-size: 0.875rem; }
        .quote-print-page table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
        .quote-print-page th, .quote-print-page td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
        .quote-print-page th { background: #f8fafc; }
        .quote-print-page .total { font-size: 1.125rem; font-weight: 700; color: #16A085; margin-top: 1rem; }
        .quote-print-page .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b; }
        @media print { .no-print { display: none; } .quote-print-page { padding: 0; } }
      `}</style>

      <div className="no-print" style={{ marginBottom: "1rem" }}>
        <PrintQuoteButton />
      </div>

      <div className="header">
        <h1>{clinic.name}</h1>
        <p style={{ margin: 0, color: "#64748b" }}>Medicina e Segurança do Trabalho</p>
      </div>

      <div className="meta">
        <div>
          <strong>Orçamento:</strong> {quote.quoteNumber}<br />
          <strong>Data:</strong> {format(quote.createdAt, "dd/MM/yyyy", { locale: ptBR })}<br />
          {quote.validUntil && (
            <>
              <strong>Validade:</strong>{" "}
              {format(quote.validUntil, "dd/MM/yyyy", { locale: ptBR })}
            </>
          )}
        </div>
        <div>
          <strong>Empresa:</strong> {quote.companyName}<br />
          {quote.responsibleName && (
            <>
              <strong>Responsável:</strong> {quote.responsibleName}
              <br />
            </>
          )}
          {quote.phone && (
            <>
              <strong>Telefone:</strong> {quote.phone}
              <br />
            </>
          )}
          {quote.email && (
            <>
              <strong>E-mail:</strong> {quote.email}
            </>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Itens do orçamento</h2>
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th>Qtd</th>
            {hasAmount && <th>Valor</th>}
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.serviceName}
                {item.notes && (
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.notes}</div>
                )}
              </td>
              <td>{item.quantity}</td>
              {hasAmount && (
                <td>
                  {item.totalPrice != null
                    ? formatCurrency(item.totalPrice)
                    : item.unitPrice != null
                      ? formatCurrency(item.unitPrice * item.quantity)
                      : "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {hasAmount ? (
        <p className="total">Valor total: {formatCurrency(quote.totalAmount)}</p>
      ) : (
        <p style={{ fontStyle: "italic", color: "#64748b" }}>
          Valores conforme análise e confirmação da equipe comercial.
        </p>
      )}

      {quote.paymentTerms && (
        <p>
          <strong>Condições de pagamento:</strong> {quote.paymentTerms}
        </p>
      )}
      {quote.clientNotes && (
        <p>
          <strong>Observações:</strong> {quote.clientNotes}
        </p>
      )}

      <div className="footer">
        <p>
          {clinic.name}
          {clinic.phone && ` · ${clinic.phone}`}
          {clinic.email && ` · ${clinic.email}`}
        </p>
        {clinic.address && <p>{clinic.address}</p>}
      </div>
    </div>
  );
}
