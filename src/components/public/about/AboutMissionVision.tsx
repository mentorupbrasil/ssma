"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_VALUES } from "@/data/about";

export function AboutMissionVision() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="missao-visao"
      ref={sectionRef}
      className="about-ed-mission scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <div className="about-ed-mission-table-card">
            <header className="about-ed-mission-table-head">
              <div className="about-ed-mission-table-dots" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <p className="about-ed-label">Missão, visão e propósito</p>
              <p className="about-ed-mission-table-sub">
                Diretrizes que orientam o atendimento e a organização da Unimetra
              </p>
            </header>

            <div className="about-ed-mission-table-wrap">
              <table className="about-ed-mission-table">
                <thead>
                  <tr>
                    <th scope="col" className="about-ed-mission-table-col-num">
                      #
                    </th>
                    <th scope="col" className="about-ed-mission-table-col-pilar">
                      Pilar
                    </th>
                    <th scope="col" className="about-ed-mission-table-col-desc">
                      Descrição
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ABOUT_VALUES.map((value, index) => {
                    const Icon = value.icon;
                    return (
                      <tr key={value.title}>
                        <td className="about-ed-mission-table-num">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td>
                          <div className="about-ed-mission-table-pilar">
                            <span className="about-ed-mission-table-icon" aria-hidden>
                              <Icon strokeWidth={1.75} />
                            </span>
                            <span className="about-ed-mission-table-title">{value.title}</span>
                          </div>
                        </td>
                        <td className="about-ed-mission-table-text">{value.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="about-ed-mission-table-foot">
              <span>
                <strong>{ABOUT_VALUES.length}</strong> pilares institucionais
              </span>
            </footer>
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
