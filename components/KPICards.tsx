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
      color: "from-purple-600/40 via-purple-500/20 to-purple-400/10",
    },
    {
      label: "Zero Bill Rate",
      value: (errorRates.zero_bill_rate * 100).toFixed(2) + "%",
      color: "from-blue-600/40 via-blue-500/20 to-blue-400/10",
    },
    {
      label: "Missing KWH",
      value: (errorRates.missing_kwh_rate * 100).toFixed(2) + "%",
      color: "from-cyan-600/40 via-cyan-500/20 to-cyan-400/10",
    },
    {
      label: "Maintenance Sites",
      value: maintenanceData.maintenance_site_count,
      color: "from-emerald-600/40 via-emerald-500/20 to-emerald-400/10",
    },
    {
      label: "Bill Without KWH",
      value: (errorRates.bill_without_kwh_rate * 100).toFixed(2) + "%",
      color: "from-orange-600/40 via-orange-500/20 to-orange-400/10",
    },
    {
      label: "Negative Values",
      value: errorRates.negative_value_rows,
      color: "from-red-600/40 via-red-500/20 to-red-400/10",
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
          className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} p-5 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-white/20`}
        >
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            {card.label}
          </p>
          <p className="mt-4 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
