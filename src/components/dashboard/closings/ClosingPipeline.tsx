import { Upload, Search, AlertTriangle, CheckCircle2, Wallet, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "import", label: "Importar", icon: Upload },
  { id: "review", label: "Conferir", icon: Search },
  { id: "fix", label: "Corrigir", icon: AlertTriangle },
  { id: "close", label: "Fechar", icon: CheckCircle2 },
  { id: "invoice", label: "Faturar", icon: FileCheck },
  { id: "receive", label: "Receber", icon: Wallet },
] as const;

type ClosingPipelineProps = {
  activeStep?: (typeof STEPS)[number]["id"];
  className?: string;
};

export function ClosingPipeline({ activeStep = "import", className }: ClosingPipelineProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className={cn("closing-pipeline", className)}>
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;

        return (
          <div
            key={step.id}
            className={cn(
              "closing-pipeline-step",
              isActive && "closing-pipeline-step-active",
              isDone && "closing-pipeline-step-done"
            )}
          >
            <div className="closing-pipeline-step-icon">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </div>
            <span className="closing-pipeline-step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
