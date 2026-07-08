"use client";

import { useEffect } from "react";
import { UI_SCALE } from "@/lib/ui-scale";

type UiScaleProps = {
  scale?: number;
};

/**
 * Aplica escala visual na página inteira (inclui portais de modal/dropdown).
 * Ative apenas em rotas do sistema (painel, login, super-admin).
 */
export function UiScale({ scale = UI_SCALE }: UiScaleProps) {
  useEffect(() => {
    const { documentElement: html } = document;
    const previousZoom = html.style.zoom;

    html.style.zoom = `${scale * 100}%`;

    return () => {
      html.style.zoom = previousZoom;
    };
  }, [scale]);

  return null;
}
