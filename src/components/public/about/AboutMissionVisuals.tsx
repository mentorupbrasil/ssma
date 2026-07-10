import type { LucideIcon } from "lucide-react";
import type { MissionVisual } from "@/data/about";

type MissionVisualProps = {
  type: MissionVisual;
  icon: LucideIcon;
};

export function MissionFeatureVisual({ type, icon: Icon }: MissionVisualProps) {
  if (type === "purpose") {
    return (
      <div className="about-ed-mission-visual about-ed-mission-visual--purpose">
        <span className="about-ed-mission-visual-ring about-ed-mission-visual-ring--outer" aria-hidden />
        <span className="about-ed-mission-visual-ring about-ed-mission-visual-ring--inner" aria-hidden />
        <span className="about-ed-mission-visual-icon" aria-hidden>
          <Icon strokeWidth={1.5} />
        </span>
      </div>
    );
  }

  if (type === "mission") {
    return (
      <div className="about-ed-mission-visual about-ed-mission-visual--mission" aria-hidden>
        <div className="about-ed-mission-structure">
          <span />
          <span />
          <span className="about-ed-mission-structure-wide" />
        </div>
      </div>
    );
  }

  return (
    <div className="about-ed-mission-visual about-ed-mission-visual--vision" aria-hidden>
      <svg className="about-ed-mission-vision-chart" viewBox="0 0 160 72" fill="none">
        <path
          d="M12 56 L44 48 L76 38 L108 26 L140 14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 56 L44 48 L76 38 L108 26 L140 14 V62 H12 Z"
          fill="currentColor"
          opacity="0.08"
        />
        <circle cx="140" cy="14" r="4" fill="currentColor" />
      </svg>
      <span className="about-ed-mission-visual-icon about-ed-mission-visual-icon--corner" aria-hidden>
        <Icon strokeWidth={1.5} />
      </span>
    </div>
  );
}
