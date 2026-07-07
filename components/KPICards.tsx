"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ErrorRates, MaintenanceData } from "@/lib/api";
import { TrendingUp, AlertCircle, Zap, Settings, BarChart3, AlertTriangle } from "lucide-react";

interface KPICard {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accentColor?: string;
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
      icon: <BarChart3 className="w-5 h-5" />,
      accentColor: "text-blue-500",
    },
    {
      label: "Zero Bill Rate",
      value: (errorRates.zero_bill_rate * 100).toFixed(2) + "%",
      icon: <AlertCircle className="w-5 h-5" />,
      accentColor: "text-amber-500",
    },
    {
      label: "Missing KWH",
      value: (errorRates.missing_kwh_rate * 100).toFixed(2) + "%",
      icon: <Zap className="w-5 h-5" />,
      accentColor: "text-orange-500",
    },
    {
      label: "Maintenance Sites",
      value: maintenanceData.maintenance_site_count,
      icon: <Settings className="w-5 h-5" />,
      accentColor: "text-emerald-500",
    },
    {
      label: "Bill Without KWH",
      value: (errorRates.bill_without_kwh_rate * 100).toFixed(2) + "%",
      icon: <AlertTriangle className="w-5 h-5" />,
      accentColor: "text-red-500",
    },
    {
      label: "Negative Values",
      value: errorRates.negative_value_rows,
      icon: <TrendingUp className="w-5 h-5" />,
      accentColor: "text-destructive",
    },
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll("[data-kpi]");
    if (items.length === 0) return;

    // Clear any existing animations
    gsap.killTweensOf(items);

    // Set initial state
    gsap.set(items, { opacity: 0, y: 24 });

    // Animate in
    setTimeout(() => {
      gsap.to(items, {
        duration: 0.6,
        opacity: 1,
        y: 0,
        stagger: 0.08,
        ease: "power2.out",
      });
    }, 100);
  }, []);

  return (
    <div
      ref={containerRef}
      className="grid w-full auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          data-kpi
          className="stat-card"
        >
          <div className={`${card.accentColor} icon`}>
            {card.icon}
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
            {card.label}
          </p>
          <p className="mt-auto text-2xl font-bold text-foreground font-mono">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
