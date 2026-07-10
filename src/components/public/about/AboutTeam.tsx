"use client";

import { useRef } from "react";

import { AboutMediaFallback } from "@/components/public/about/AboutMediaFallback";
import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_TEAM, ABOUT_TEAM_MEMBERS } from "@/data/about";

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

        <ul className="about-ed-team-list">
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
                as="li"
                className="about-ed-team-item"
              >
                {member.photo ? (
                  <AboutMediaFallback
                    icon={Icon}
                    image={member.photo}
                    alt={photoAlt}
                    variant="team"
                    className="about-ed-team-item-photo"
                  />
                ) : (
                  <span className="about-ed-team-item-avatar" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                )}
                <div className="about-ed-team-item-body">
                  {member.name ? (
                    <>
                      <p className="about-ed-team-item-role">{member.role}</p>
                      <h3>{member.name}</h3>
                    </>
                  ) : (
                    <h3>{member.role}</h3>
                  )}
                  {member.registration ? (
                    <p className="about-ed-team-item-registration">{member.registration}</p>
                  ) : null}
                  <p className="about-ed-team-item-desc">{member.description}</p>
                </div>
              </TimelineContent>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
