import { HardHat, Headset, HeartPulse, type LucideIcon } from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_TEAM, ABOUT_TEAM_GROUPS } from "@/data/about";
import { cn } from "@/lib/utils";

const GROUP_ICONS: Record<string, LucideIcon> = {
  medicina: HeartPulse,
  sst: HardHat,
  apoio: Headset,
};

export function AboutTeam() {
  return (
    <section id="nossa-equipe" className="about-team scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_TEAM.eyebrow}
          title={ABOUT_TEAM.title}
          description={ABOUT_TEAM.description}
          align="center"
        />

        <ul className="about-team-groups">
          {ABOUT_TEAM_GROUPS.map((group) => {
            const Icon = GROUP_ICONS[group.variant] ?? HeartPulse;

            return (
              <li
                key={group.area}
                className={cn("about-team-group", `about-team-group--${group.variant}`)}
              >
                <div className="about-team-group-head">
                  <span className="about-team-group-icon" aria-hidden>
                    <Icon strokeWidth={1.7} />
                  </span>
                  <div className="about-team-group-heading">
                    <h3 className="about-team-group-title">{group.area}</h3>
                    <p className="about-team-group-desc">{group.description}</p>
                  </div>
                </div>

                <ul
                  className="about-team-roles"
                  aria-label={`Profissionais de ${group.area}`}
                >
                  {group.roles.map((role) => (
                    <li key={role}>{role}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
