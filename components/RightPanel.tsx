"use client";

import { Wallet, ArrowRight } from "lucide-react";

interface RightPanelProps {
  isReady: boolean;
  rowsTotal?: number;
  maintenanceSites?: number;
}

export function RightPanel({ isReady, rowsTotal, maintenanceSites }: RightPanelProps) {
  return (
    <aside className="fixed right-0 top-0 h-screen w-80 border-l border-border/40 bg-card/50 backdrop-blur flex flex-col overflow-y-auto">
      {/* Header Spacing */}
      <div className="h-20" />

      {/* Main Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Card 1: Upload Status */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Data Status</h3>
            <span className={`h-3 w-3 rounded-full ${isReady ? "bg-success" : "bg-warning"}`} />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {isReady
              ? "All systems operational"
              : "Waiting for file upload"}
          </p>
          <div className="space-y-2">
            {rowsTotal && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Rows</span>
                <span className="font-semibold">{(rowsTotal / 1000).toFixed(1)}K</span>
              </div>
            )}
            {maintenanceSites && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="font-semibold">{maintenanceSites}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold px-2">Quick Actions</h3>
          <button className="w-full rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 px-4 py-3 text-sm font-medium text-primary transition flex items-center justify-between">
            <span>Export Report</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="w-full rounded-lg bg-surface/50 hover:bg-surface border border-border px-4 py-3 text-sm font-medium transition flex items-center justify-between">
            <span>View API Docs</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Card 3: Info */}
        <div className="rounded-xl bg-surface/50 border border-border p-4">
          <div className="flex items-start gap-3">
            <Wallet className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold mb-1">Pro Tip</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use filters to drill down into specific providers and companies for detailed analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
