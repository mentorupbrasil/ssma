"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ensureAssinaturaAction,
  loadAssinaturaDataAction,
  openPaymentChargeAction,
  pollChargeStatusAction,
} from "@/actions/subscription";
import { cn } from "@/lib/utils";

type ChargeDto = {
  id: string;
  cycleNumber: number;
  competence: string;
  competenceLabel: string;
  amount: number;
  amountLabel: string;
  status: string;
  statusLabel: string;
  dueDate: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  pixCode: string | null;
  qrCode: string | null;
  payable: boolean;
};

type AssinaturaPayload = Extract<
  Awaited<ReturnType<typeof loadAssinaturaDataAction>>,
  { ok: true }
>;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export function AssinaturaClient({
  initial,
}: {
  initial: AssinaturaPayload;
}) {
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(initial.page);
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCharge, setModalCharge] = useState<ChargeDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paidFlash, setPaidFlash] = useState(false);
  const [detailCharge, setDetailCharge] = useState<ChargeDto | null>(null);
  const triedEnsure = useRef(false);

  const currentPaid = data.currentPaid;
  const totalPages = Math.max(1, Math.ceil(data.totalCharges / data.pageSize));

  const reload = useCallback((p = page) => {
    startTransition(async () => {
      const next = await loadAssinaturaDataAction(p);
      if (next.ok) {
        setData(next);
        setPage(next.page);
      }
    });
  }, [page]);

  useEffect(() => {
    if (!data.subscription && data.configured && !triedEnsure.current) {
      triedEnsure.current = true;
      startTransition(async () => {
        const next = await ensureAssinaturaAction();
        if (next.ok) setData(next);
        else if (next.error === "identity_incomplete") {
          toast.error(
            "Complete razão social, e-mail e CNPJ em Configurações antes de ativar a assinatura."
          );
        } else if (next.error === "plan_missing") {
          toast.error("Plano SyncPay ainda não configurado. Execute a rotina de setup.");
        } else if (next.error === "charge_failed") {
          toast.error("Não foi possível gerar a cobrança. Tente novamente.");
        }
      });
    }
  }, [data.subscription, data.configured]);

  useEffect(() => {
    if (!modalOpen || !modalCharge || modalCharge.status === "paid") return;
    const timer = setInterval(async () => {
      const polled = await pollChargeStatusAction(modalCharge.id);
      if (!polled.ok) return;
      setModalCharge(polled.charge);
      if (polled.paid) {
        setPaidFlash(true);
        toast.success("Pagamento confirmado com sucesso");
        reload();
        setTimeout(() => setModalOpen(false), 1200);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [modalOpen, modalCharge, reload]);

  useEffect(() => {
    let cancelled = false;
    async function buildQr() {
      if (!modalCharge?.pixCode) {
        setQrDataUrl(null);
        return;
      }
      if (modalCharge.qrCode && /^https?:\/\//i.test(modalCharge.qrCode)) {
        setQrDataUrl(modalCharge.qrCode);
        return;
      }
      if (modalCharge.qrCode?.startsWith("data:")) {
        setQrDataUrl(modalCharge.qrCode);
        return;
      }
      try {
        const QR = await import("qrcode");
        const url = await QR.toDataURL(modalCharge.pixCode, {
          margin: 1,
          width: 220,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }
    void buildQr();
    return () => {
      cancelled = true;
    };
  }, [modalCharge?.id, modalCharge?.pixCode, modalCharge?.qrCode]);

  const statusTone = useMemo(() => {
    const key = data.subscription?.statusKey;
    if (key === "active") return "ok";
    if (key === "overdue" || key === "suspended") return "danger";
    if (key === "cancelled") return "muted";
    return "warn";
  }, [data.subscription?.statusKey]);

  async function handlePay(fromCharge?: ChargeDto) {
    setPaying(true);
    setPaidFlash(false);
    try {
      const result = await openPaymentChargeAction();
      if (!result.ok) {
        if (result.error === "identity_incomplete") {
          toast.error(
            "Complete razão social, e-mail e CNPJ em Configurações antes de pagar."
          );
        } else if (result.error === "plan_missing") {
          toast.error("Plano SyncPay ainda não configurado. Execute a rotina de setup.");
        } else {
          toast.error("Não foi possível gerar a cobrança. Tente novamente.");
        }
        return;
      }
      if (result.alreadyPaid) {
        toast.success("Mensalidade paga");
        reload();
        return;
      }
      setModalCharge(fromCharge?.id === result.charge.id ? { ...result.charge } : result.charge);
      setModalOpen(true);
    } finally {
      setPaying(false);
    }
  }

  async function copyPix(code: string | null | undefined) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código Pix copiado");
    } catch {
      toast.error("Não foi possível copiar o código Pix.");
    }
  }

  if (!data.configured) {
    return (
      <div className="assinatura-page">
        <header className="assinatura-header">
          <h1 className="assinatura-title">Assinatura</h1>
          <p className="assinatura-desc">
            Consulte sua mensalidade, realize o pagamento e acompanhe o histórico.
          </p>
        </header>
        <p className="assinatura-empty">
          A integração de cobrança ainda não está configurada. Contate o suporte Unimetra.
        </p>
      </div>
    );
  }

  return (
    <div className="assinatura-page">
      <header className="assinatura-header">
        <div className="assinatura-header-row">
          <div>
            <h1 className="assinatura-title">Assinatura</h1>
            <p className="assinatura-desc">
              Consulte sua mensalidade, realize o pagamento e acompanhe o histórico.
            </p>
          </div>
          <Button
            type="button"
            disabled={paying || pending || currentPaid}
            onClick={() => void handlePay()}
            className="assinatura-pay-btn"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {currentPaid ? "Mensalidade paga" : "Pagar mensalidade"}
          </Button>
        </div>
      </header>

      {paidFlash ? (
        <p className="assinatura-flash" role="status">
          Pagamento confirmado com sucesso
        </p>
      ) : null}

      <dl className="assinatura-meta">
        <div>
          <dt>Plano contratado</dt>
          <dd>{data.subscription?.planName ?? "Assinatura Unimetra"}</dd>
        </div>
        <div>
          <dt>Valor mensal</dt>
          <dd>{data.subscription?.amountLabel ?? "—"}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>
            <span className={cn("assinatura-status", `assinatura-status--${statusTone}`)}>
              {data.subscription?.statusLabel ?? "—"}
            </span>
          </dd>
        </div>
        <div>
          <dt>Próximo vencimento</dt>
          <dd>{formatDate(data.subscription?.nextDueAt ?? data.currentCharge?.dueDate ?? null)}</dd>
        </div>
        <div>
          <dt>Último pagamento</dt>
          <dd>{formatDate(data.subscription?.lastPaidAt ?? null)}</dd>
        </div>
        <div>
          <dt>Forma de pagamento</dt>
          <dd>Pix</dd>
        </div>
        <div>
          <dt>Prazo de tolerância</dt>
          <dd>
            {data.subscription?.gracePeriodDays != null
              ? `${data.subscription.gracePeriodDays} dias`
              : "—"}
          </dd>
        </div>
      </dl>

      {data.subscription?.checkoutUrl ? (
        <p className="assinatura-checkout">
          <a
            href={data.subscription.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="assinatura-checkout-link"
          >
            Pagar no ambiente da SyncPay
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </p>
      ) : null}

      <section className="assinatura-history" aria-labelledby="assinatura-history-title">
        <h2 id="assinatura-history-title" className="assinatura-section-title">
          Histórico de mensalidades
        </h2>
        <div className="assinatura-table-wrap">
          <table className="assinatura-table">
            <thead>
              <tr>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.charges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="assinatura-table-empty">
                    Nenhuma cobrança registrada ainda.
                  </td>
                </tr>
              ) : (
                data.charges.map((charge) => (
                  <tr key={charge.id}>
                    <td>{charge.competenceLabel}</td>
                    <td>{formatDate(charge.dueDate)}</td>
                    <td>{charge.amountLabel}</td>
                    <td>{formatDate(charge.paidAt)}</td>
                    <td>{charge.statusLabel}</td>
                    <td>
                      <div className="assinatura-actions">
                        <button
                          type="button"
                          className="assinatura-link-btn"
                          onClick={() => setDetailCharge(charge)}
                        >
                          Ver detalhes
                        </button>
                        {charge.payable && charge.pixCode ? (
                          <button
                            type="button"
                            className="assinatura-link-btn"
                            onClick={() => void copyPix(charge.pixCode)}
                          >
                            Copiar Pix
                          </button>
                        ) : null}
                        {charge.payable ? (
                          <button
                            type="button"
                            className="assinatura-link-btn"
                            onClick={() => void handlePay(charge)}
                          >
                            Pagar
                          </button>
                        ) : null}
                        {charge.status === "paid" ? (
                          <button
                            type="button"
                            className="assinatura-link-btn"
                            onClick={() => setDetailCharge(charge)}
                          >
                            Ver comprovante
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="assinatura-pager">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || pending}
              onClick={() => reload(page - 1)}
            >
              Anterior
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || pending}
              onClick={() => reload(page + 1)}
            >
              Próxima
            </Button>
          </div>
        ) : null}
      </section>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="assinatura-pay-modal sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mensalidade de {modalCharge?.competenceLabel ?? "—"}
            </DialogTitle>
            <DialogDescription className="assinatura-pay-meta">
              <span>Valor: {modalCharge?.amountLabel}</span>
              <span>Vencimento: {formatDate(modalCharge?.dueDate ?? null)}</span>
              <span>Status: {modalCharge?.statusLabel}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="assinatura-qr-block">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR Code Pix da mensalidade" className="assinatura-qr" />
            ) : (
              <p className="text-sm text-[var(--dash-text-muted)]">
                Use o código Pix Copia e Cola abaixo.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!modalCharge?.pixCode}
              onClick={() => void copyPix(modalCharge?.pixCode)}
            >
              <Copy className="h-4 w-4" />
              Copiar código Pix
            </Button>
            <p className="assinatura-waiting" role="status">
              {modalCharge?.status === "paid"
                ? "Pagamento confirmado com sucesso"
                : "Aguardando confirmação do pagamento..."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailCharge} onOpenChange={(o) => !o && setDetailCharge(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da mensalidade</DialogTitle>
            <DialogDescription>
              {detailCharge?.competenceLabel} · {detailCharge?.statusLabel}
            </DialogDescription>
          </DialogHeader>
          {detailCharge ? (
            <dl className="assinatura-detail-grid">
              <div>
                <dt>Valor</dt>
                <dd>{detailCharge.amountLabel}</dd>
              </div>
              <div>
                <dt>Vencimento</dt>
                <dd>{formatDate(detailCharge.dueDate)}</dd>
              </div>
              <div>
                <dt>Pagamento</dt>
                <dd>{formatDateTime(detailCharge.paidAt)}</dd>
              </div>
              <div>
                <dt>Ciclo</dt>
                <dd>{detailCharge.cycleNumber}</dd>
              </div>
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
