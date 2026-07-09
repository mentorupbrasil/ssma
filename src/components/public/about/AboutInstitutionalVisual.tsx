import { Activity, FileCheck, Shield } from "lucide-react";

const CLIP_ID = "about-institutional-clip";

export function AboutInstitutionalVisual() {
  return (
    <div className="about-ed-visual" aria-hidden>
      <svg
        className="about-ed-visual-svg"
        viewBox="0 0 100 42"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Composição visual institucional da Unimetra"
      >
        <defs>
          <clipPath id={CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d="M0.06 1H0.38H0.72C0.76 1 0.78 0.96 0.78 0.93V0.82C0.79 0.76 0.81 0.74 0.83 0.75H0.96C0.99 0.73 1 0.69 0.99 0.67V0.08C0.99 0.03 0.97 0.01 0.96 0H0.88C0.84 0 0.87 0.12 0.83 0.12H0.04C0.02 0.13 0 0.17 0 0.2V0.42C0 0.46 0.02 0.48 0.04 0.49H0.07C0.09 0.49 0.1 0.52 0.1 0.54V0.9C0.09 0.97 0.1 1 0.06 1Z" />
          </clipPath>
          <linearGradient id="about-ed-visual-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eef8f5" />
            <stop offset="45%" stopColor="#e2f0f4" />
            <stop offset="100%" stopColor="#d8ebe8" />
          </linearGradient>
          <linearGradient id="about-ed-visual-accent" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(22 160 133 / 0.12)" />
            <stop offset="100%" stopColor="rgb(15 61 74 / 0.08)" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${CLIP_ID})`}>
          <rect width="100" height="42" fill="url(#about-ed-visual-grad)" />
          <rect width="100" height="42" fill="url(#about-ed-visual-accent)" />

          {/* Grid sutil */}
          <g opacity="0.35" stroke="rgb(15 61 74 / 0.06)" strokeWidth="0.15">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="42" />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 10.5} x2="100" y2={i * 10.5} />
            ))}
          </g>

          {/* Linha de eletrocardiograma */}
          <path
            d="M4 24 L10 24 L12 18 L15 30 L18 20 L22 24 L28 24 L30 17 L34 28 L38 22 L44 24 L52 24 L54 16 L58 27 L62 21 L68 24 L76 24 L78 19 L82 26 L86 23 L92 24 L96 24"
            fill="none"
            stroke="rgb(22 160 133 / 0.55)"
            strokeWidth="0.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Painéis discretos */}
          <rect x="8" y="8" width="22" height="10" rx="1.2" fill="white" fillOpacity="0.72" />
          <rect x="34" y="8" width="28" height="10" rx="1.2" fill="white" fillOpacity="0.55" />
          <rect x="66" y="8" width="26" height="10" rx="1.2" fill="rgb(15 61 74 / 0.06)" />

          <rect x="8" y="30" width="36" height="8" rx="1" fill="white" fillOpacity="0.5" />
          <rect x="48" y="30" width="44" height="8" rx="1" fill="rgb(22 160 133 / 0.08)" />
        </g>
      </svg>

      <div className="about-ed-visual-float about-ed-visual-float--tl">
        <Shield strokeWidth={1.75} />
      </div>
      <div className="about-ed-visual-float about-ed-visual-float--tr">
        <FileCheck strokeWidth={1.75} />
      </div>
      <div className="about-ed-visual-float about-ed-visual-float--br">
        <Activity strokeWidth={1.75} />
      </div>
    </div>
  );
}
