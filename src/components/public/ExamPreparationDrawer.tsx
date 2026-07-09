"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { MessageCircle, X } from "lucide-react";
import type { ExamGuide } from "@/data/exams";
import {
  buildWhatsAppShareMessage,
  copyExamInstructions,
  DISPLAY_CATEGORY_LABELS,
  PREPARATION_STATUS_LABELS,
} from "@/lib/exam-preparation";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ExamPreparationDrawerProps = {
  exam: ExamGuide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="exam-drawer-section">
      <h3 className="exam-drawer-section-title">{title}</h3>
      <div className="exam-drawer-section-body">{children}</div>
    </section>
  );
}

function useDrawerSide() {
  const [side, setSide] = useState<"right" | "bottom">("right");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setSide(media.matches ? "bottom" : "right");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return side;
}

export function ExamPreparationDrawer({ exam, open, onOpenChange }: ExamPreparationDrawerProps) {
  const side = useDrawerSide();
  const clinic = getClinicInfo();

  if (!exam) return null;

  const handleWhatsAppShare = () => {
    window.open(whatsappLink(buildWhatsAppShareMessage(exam)), "_blank", "noopener,noreferrer");
  };

  const specialistHref = whatsappLink(
    `Olá! Tenho dúvidas sobre o preparo do exame ${exam.name} na ${clinic.name}.`
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={false}
        className={cn(
          "exam-drawer gap-0 overflow-hidden p-0",
          side === "right" && "w-full sm:max-w-xl",
          side === "bottom" && "max-h-[92vh] rounded-t-2xl"
        )}
        aria-describedby={`exam-drawer-desc-${exam.slug}`}
      >
        <div className="exam-drawer-header">
          <div className="exam-drawer-header-main">
            <div className="exam-drawer-badges">
              <span className="exam-drawer-badge exam-drawer-badge--category">
                {DISPLAY_CATEGORY_LABELS[exam.displayCategory]}
              </span>
              <span className="exam-drawer-badge exam-drawer-badge--status">
                {PREPARATION_STATUS_LABELS[exam.preparationStatus]}
              </span>
            </div>
            <SheetTitle className="exam-drawer-title">{exam.name}</SheetTitle>
            <SheetDescription className="sr-only">
              Orientações de preparo para {exam.name}
            </SheetDescription>
          </div>
          <button
            type="button"
            className="exam-drawer-close"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar detalhes do exame"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="exam-drawer-scroll" id={`exam-drawer-desc-${exam.slug}`}>
          <DrawerSection title="Preparo necessário">
            <p>{exam.preparationBefore}</p>
          </DrawerSection>
          <DrawerSection title="Prazo médio">
            <p>{exam.deliveryTime}</p>
          </DrawerSection>
          <DrawerSection title="No dia do exame">
            <p>{exam.preparationOnDay}</p>
          </DrawerSection>
          {exam.notes && (
            <DrawerSection title="Observações importantes">
              <p>{exam.notes}</p>
            </DrawerSection>
          )}
          <DrawerSection title="Quando informar a clínica">
            <p>{exam.whenToInformClinic}</p>
          </DrawerSection>
          <div className="exam-drawer-notice">
            As orientações podem variar conforme solicitação médica, PCMSO, protocolo da clínica ou
            tipo de exame.
          </div>
        </div>

        <div className="exam-drawer-footer">
          <CopyButton
            className="w-full rounded-xl"
            label="Compartilhar preparo"
            onCopy={() => copyExamInstructions(exam)}
            successMessage="Orientações copiadas com sucesso."
            errorMessage="Não foi possível copiar as orientações."
          />
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={handleWhatsAppShare}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar por WhatsApp
          </Button>
          <Link href="/encaminhamento-online" className="w-full">
            <Button variant="brand" className="w-full rounded-xl">
              Fazer encaminhamento online
            </Button>
          </Link>
          <a href={specialistHref} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="ghost" className="w-full rounded-xl text-slate-600">
              Falar com especialista
            </Button>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
