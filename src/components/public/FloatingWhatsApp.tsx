"use client";

import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/helpers";

const DEFAULT_MESSAGE =
  "Olá! Quero fazer um encaminhamento ocupacional e preciso de ajuda.";

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappLink(DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com especialista no WhatsApp"
      className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgb(37_211_102/0.45)] transition hover:scale-105 hover:bg-[#20bd5a] md:bottom-8 md:right-8 lg:bottom-8"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
