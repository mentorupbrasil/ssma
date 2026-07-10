"use client";

import { useRef } from "react";

import { AboutMediaFallback } from "@/components/public/about/AboutMediaFallback";
import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_TEAM, ABOUT_TEAM_MEMBERS } from "@/data/about";

const ACCENTS = ["a", "b", "c", "d"] as const;

export function AboutTeam() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="nossa-equipe"
      ref={sectionRef}
      className="about-ed-team scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow={ABOUT_TEAM.eyebrow}
            title={ABOUT_TEAM.title}
            description={ABOUT_TEAM.description}
            className="about-ed-section-header"
          />
        </TimelineContent>

        <div className="about-ed-team-grid">
          {ABOUT_TEAM_MEMBERS.map((member, index) => {
            const Icon = member.icon;
            const photoAlt = member.name
              ? `${member.name}, ${member.role}`
              : `${member.role} — Unimetra`;

            return (
              <TimelineContent
                key={member.role}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className="about-ed-team-card"
              >
                <AboutMediaFallback
                  icon={Icon}
                  image={member.photo}
                  alt={photoAlt}
                  variant="team"
                  accent={ACCENTS[index % ACCENTS.length]}
                  className="about-ed-team-card-media"
                />
                <div className="about-ed-team-card-body">
                  {member.name ? (
                    <>
                      <p className="about-ed-team-card-role">{member.role}</p>
                      <h3 className="about-ed-team-card-name">{member.name}</h3>
                    </>
                  ) : (
                    <h3 className="about-ed-team-card-name">{member.role}</h3>
                  )}
                  {member.registration ? (
                    <p className="about-ed-team-card-registration">{member.registration}</p>
                  ) : null}
                  <p className="about-ed-team-card-desc">{member.description}</p>
                </div>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
