"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ErrorRates, MaintenanceData } from "@/lib/api";

interface KPICard {
  label: string;
  value: string | number;
  format?: (val: number) => string;
  icon?: React.ReactNode;
  color?: string;
}

interface KPICardsProps {
  errorRates: ErrorRates;
  maintenanceData: MaintenanceData;
}

export function KPICards({ errorRates, maintenanceData }: KPICardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const cards: KPICard[] = [
    {
      label: "Total Rows",
      value: errorRates.total_rows.toLocaleString(),
      color: "from-primary/20 to-primary/5",
    },
    {
      label: "Zero Bill Rate",
      value: (errorRates.zero_bill_rate * 100).toFixed(2) + "%",
      color: "from-warning/20 to-warning/5",
    },
    {
      label: "Missing KWH",
      value: (errorRates.missing_kwh_rate * 100).toFixed(2) + "%",
      color: "from-info/20 to-info/5",
    },
    {
      label: "Maintenance Sites",
      value: maintenanceData.maintenance_site_count,
      color: "from-success/20 to-success/5",
    },
    {
      label: "Bill Without KWH",
      value: (errorRates.bill_without_kwh_rate * 100).toFixed(2) + "%",
      color: "from-destructive/20 to-destructive/5",
    },
    {
      label: "Negative Values",
      value: errorRates.negative_value_rows,
      color: "from-accent/20 to-accent/5",
    },
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll("[data-kpi]");
    gsap.from(items, {
      duration: 0.8,
      y: 20,
      opacity: 0,
      stagger: 0.1,
      ease: "power2.out",
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          data-kpi
          className={`rounded-lg border border-border bg-gradient-to-br ${card.color} p-4 backdrop-blur-sm`}
        >
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
