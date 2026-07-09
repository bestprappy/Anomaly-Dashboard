"use client";

import { Banknote, RefreshCw } from "lucide-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SectionCard } from "@/components/ui/SectionCard";
import { ImpactNotReady } from "@/features/impact/components/ImpactNotReady";
import { ImpactSummaryTiles } from "@/features/impact/components/ImpactSummaryTiles";
import { MonthlyImpactChart } from "@/features/impact/components/MonthlyImpactChart";
import { MonthlyImpactTable } from "@/features/impact/components/MonthlyImpactTable";
import { ProviderImpactTable } from "@/features/impact/components/ProviderImpactTable";
import { useImpactSummary } from "@/features/impact/hooks";

/**
 * Financial Impact page: what the classified spike-up anomalies likely cost,
 * summarized per month and per provider. Pure composition — data fetching
 * and widgets live in the impact feature.
 */

function ImpactContent() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useImpactSummary();

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))}
        </div>
        <div className="skeleton h-96 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorNotice
        title="Couldn't load the impact summary"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return <ImpactNotReady />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="btn-base btn-ghost text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      <ImpactSummaryTiles impact={data} />

      <SectionCard
        title="Estimated excess cost by month"
        description="Monthly total of excess kWh priced at each site's own average baht/kWh."
      >
        <div className="space-y-6">
          <MonthlyImpactChart months={data.summary_by_month} />
          <MonthlyImpactTable months={data.summary_by_month} />
        </div>
      </SectionCard>

      <SectionCard
        title="Breakdown by provider"
        description="PEA and MEA tariffs differ, so each provider's estimate is priced from its own sites' billing history."
      >
        <ProviderImpactTable providers={data.summary_by_provider} />
      </SectionCard>
    </div>
  );
}

export default function ImpactPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Banknote className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Financial Impact</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground">
                Estimated cost of the classified spike-up anomalies: usage above the model&apos;s
                expected kWh, priced with each site&apos;s own baht/kWh rate. Sustained step-ups are
                excluded — a new baseline isn&apos;t a recoverable loss.
              </p>
            </div>
          </header>

          <ErrorBoundary>
            <ImpactContent />
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
}
