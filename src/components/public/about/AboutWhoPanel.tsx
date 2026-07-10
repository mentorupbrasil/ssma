import { Check } from "lucide-react";
import { ABOUT_WHO_CHECKLIST, ABOUT_WHO_CHIPS } from "@/data/about";

type AboutWhoPanelProps = {
  clinicName: string;
};

export function AboutWhoPanel({ clinicName }: AboutWhoPanelProps) {
  return (
    <aside className="about-ed-who-panel">
      <div className="about-ed-who-panel-card">
        <div className="about-ed-who-panel-top">
          <div>
            <p className="about-ed-who-panel-eyebrow">Assinatura institucional</p>
            <p className="about-ed-who-panel-title">{clinicName}</p>
            <p className="about-ed-who-panel-location">Imperatriz · MA</p>
          </div>
        </div>

        <p className="about-ed-who-specialties">
          {ABOUT_WHO_CHIPS.join(" · ")}
        </p>

        <ul className="about-ed-who-checklist">
          {ABOUT_WHO_CHECKLIST.map((item) => (
            <li key={item}>
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <blockquote className="about-ed-who-signature">
        Estrutura clínica, organização documental e tecnologia a serviço do RH.
      </blockquote>
    </aside>
  );
}
