import { AboutBrandFrame } from "@/components/public/about/AboutBrandFrame";
import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_TEAM, ABOUT_TEAM_MEMBERS } from "@/data/about";

const TEAM_VARIANTS = {
  medicina: "team-medicina",
  examinador: "team-examinador",
  sst: "team-sst",
  rh: "team-rh",
} as const;

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
            const photoAlt = member.name ? `${member.name}, ${member.role}` : `${member.role} — Unimetra`;

            return (
              <article key={member.role} className="about-team-card">
                <AboutBrandFrame
                  image={member.photo}
                  alt={photoAlt}
                  variant={TEAM_VARIANTS[member.variant]}
                  className="about-team-card-media"
                />
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
