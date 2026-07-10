import {
  ClipboardPlus,
  Headset,
  HardHat,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_TEAM, ABOUT_TEAM_MEMBERS } from "@/data/about";
import { cn } from "@/lib/utils";

const TEAM_ICONS: Record<string, LucideIcon> = {
  medicina: Stethoscope,
  examinador: ClipboardPlus,
  sst: HardHat,
  rh: Headset,
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

        <div className="about-team-grid">
          {ABOUT_TEAM_MEMBERS.map((member) => {
            const Icon = TEAM_ICONS[member.variant] ?? Stethoscope;

            return (
              <article key={member.role} className="about-team-card">
                <span
                  className={cn("about-team-avatar", `about-team-avatar--${member.variant}`)}
                  aria-hidden
                >
                  <Icon strokeWidth={1.6} />
                </span>

                <div className="about-team-card-body">
                  {member.name ? (
                    <>
                      <p className="about-team-role">{member.role}</p>
                      <h3>{member.name}</h3>
                    </>
                  ) : (
                    <h3>{member.role}</h3>
                  )}
                  {member.registration ? (
                    <p className="about-team-registration">{member.registration}</p>
                  ) : null}
                  <p className="about-team-desc">{member.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
