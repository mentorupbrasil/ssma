"use client";

import { useRef } from "react";

import { AboutBrandFrame } from "@/components/public/about/AboutBrandFrame";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_TEAM, ABOUT_TEAM_MEMBERS } from "@/data/about";

const TEAM_VARIANTS = {
  medicina: "team-medicina",
  examinador: "team-examinador",
  sst: "team-sst",
  rh: "team-rh",
} as const;

const TEAM_LABELS: Record<keyof typeof TEAM_VARIANTS, string> = {
  medicina: "Clínica",
  examinador: "Exames",
  sst: "Técnico",
  rh: "Suporte",
};

export function AboutTeam() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="nossa-equipe" ref={sectionRef} className="about-v2-team scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-sec-head about-v2-sec-head--center">
          <span className="about-v2-sec-index" aria-hidden>
            04
          </span>
          <div className="about-v2-sec-head-copy">
            <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_TEAM.eyebrow}</p>
            <h2 className="about-v2-section-title">{ABOUT_TEAM.title}</h2>
            <p className="about-v2-section-lead about-v2-section-lead--inline">{ABOUT_TEAM.description}</p>
          </div>
        </TimelineContent>

        <div className="about-v2-team-grid">
          {ABOUT_TEAM_MEMBERS.map((member, index) => {
            const photoAlt = member.name ? `${member.name}, ${member.role}` : `${member.role} — Unimetra`;

            return (
              <TimelineContent
                key={member.role}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className="about-v2-team-profile"
              >
                <div className="about-v2-team-photo">
                  <AboutBrandFrame
                    image={member.photo}
                    alt={photoAlt}
                    variant={TEAM_VARIANTS[member.variant]}
                    className="about-v2-team-card-media"
                  />
                  <span className="about-v2-team-badge">{TEAM_LABELS[member.variant]}</span>
                </div>
                <div className="about-v2-team-info">
                  {member.name ? (
                    <>
                      <p className="about-v2-team-role">{member.role}</p>
                      <h3>{member.name}</h3>
                    </>
                  ) : (
                    <h3>{member.role}</h3>
                  )}
                  {member.registration ? (
                    <p className="about-v2-team-registration">{member.registration}</p>
                  ) : null}
                  <p className="about-v2-team-desc">{member.description}</p>
                </div>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
