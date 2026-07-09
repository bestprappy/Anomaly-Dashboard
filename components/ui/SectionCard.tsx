import type { ReactNode } from "react";

/** Card shell with a titled header — the un-numbered sibling of StepSection. */

interface SectionCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="card-base p-6" aria-label={title}>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
