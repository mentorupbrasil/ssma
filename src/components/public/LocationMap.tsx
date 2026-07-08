"use client";

import { useState } from "react";
import { ExternalLink, MapPin, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationMapProps {
  /** URL de embed (OpenStreetMap ou Google Maps). */
  embedUrl: string;
  location?: string;
  addressLine?: string;
  mapsUrl?: string;
  className?: string;
}

export function LocationMap({
  embedUrl,
  location = "Unimetra",
  addressLine,
  mapsUrl,
  className,
}: LocationMapProps) {
  const [expanded, setExpanded] = useState(false);

  if (!embedUrl) return null;

  return (
    <div
      className={cn(
        "clinic-map",
        expanded && "clinic-map--expanded",
        className
      )}
    >
      <iframe
        title={`Mapa — ${location}`}
        src={embedUrl}
        className="clinic-map-frame"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      <div className="clinic-map-toolbar">
        <div className="clinic-map-toolbar-info">
          <MapPin className="h-4 w-4 shrink-0 text-[#16A085]" strokeWidth={2} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{location}</p>
            {addressLine ? (
              <p className="truncate text-xs text-slate-500">{addressLine}</p>
            ) : null}
          </div>
        </div>

        <div className="clinic-map-toolbar-actions">
          <button
            type="button"
            className="clinic-map-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Recolher mapa" : "Expandir mapa"}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="clinic-map-btn clinic-map-btn--primary"
              aria-label="Abrir rotas no Google Maps"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Rotas</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
