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
    <section id="como-trabalhamos" className="home-process about-process scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_WORKFLOW.eyebrow}
          title={ABOUT_WORKFLOW.title}
          description={ABOUT_WORKFLOW.description}
          align="center"
        />

        <div className="home-process-timeline about-process-timeline">
          {ABOUT_WORKFLOW_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? ClipboardList;
            return (
              <article key={step.step} className="home-process-step">
                <div className="home-process-step-head">
                  <span className="home-process-step-num" aria-hidden>
                    {step.step}
                  </span>
                  <span className="home-process-step-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="home-process-step-title">{step.title}</h3>
                <p className="home-process-step-desc">{step.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
