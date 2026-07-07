import type { ReactNode } from "react";

/** Numbered card shell for each stage of the detection workflow. */

interface StepSectionProps {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}

export function StepSection({ step, title, description, children }: StepSectionProps) {
  return (
    <section className="card-base p-6" aria-label={`Step ${step}: ${title}`}>
      <div className="mb-5 flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
        >
          {step}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
