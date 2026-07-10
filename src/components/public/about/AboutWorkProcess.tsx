import {
  ClipboardList,
  FileOutput,
  MessageSquare,
  Route,
  type LucideIcon,
} from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_WORKFLOW, ABOUT_WORKFLOW_STEPS } from "@/data/about";

const STEP_ICONS: LucideIcon[] = [MessageSquare, ClipboardList, Route, FileOutput];

export function AboutWorkProcess() {
  return (
    <section id="como-trabalhamos" className="about-process scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_WORKFLOW.eyebrow}
          title={ABOUT_WORKFLOW.title}
          description={ABOUT_WORKFLOW.description}
          align="center"
        />

        <div className="about-process-rail">
          <div className="about-process-track" aria-hidden />

          <ol className="about-process-steps">
            {ABOUT_WORKFLOW_STEPS.map((step, index) => {
              const Icon = STEP_ICONS[index] ?? ClipboardList;

              return (
                <li key={step.step} className="about-process-step">
                  <div className="about-process-node" aria-hidden>
                    <span>{String(step.step).padStart(2, "0")}</span>
                  </div>

                  <article className="about-process-card">
                    <span className="about-process-card-icon" aria-hidden>
                      <Icon strokeWidth={1.75} />
                    </span>
                    <h3 className="about-process-card-title">{step.title}</h3>
                    <p className="about-process-card-desc">{step.text}</p>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
