"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { api } from "@/lib/api";
import { UploadWidget } from "@/components/UploadWidget";
import { KPICards } from "@/components/KPICards";
import { TrendChart } from "@/components/TrendChart";
import { SiteSearch } from "@/components/SiteSearch";
import { DataQualityTable } from "@/components/DataQualityTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useAtom } from "jotai";
import { selectedSiteIdAtom, filterProviderAtom } from "@/lib/atoms";
import { AlertCircle, Database, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [selectedSiteId] = useAtom(selectedSiteIdAtom);
  const [filterProvider] = useAtom(filterProviderAtom);

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["uploadStatus"],
    queryFn: () => api.getUploadStatus(),
  });

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ["edaSummary"],
    queryFn: () => api.getEDASummary(),
    enabled: status?.ready === true,
  });

  const { data: trend } = useQuery({
    queryKey: ["siteTrend", selectedSiteId],
    queryFn: () => api.getSiteTrend(selectedSiteId!),
    enabled: Boolean(selectedSiteId),
  });

  useEffect(() => {
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll("[data-animate]");
      gsap.from(elements, {
        duration: 0.8,
        opacity: 0,
        y: 30,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [summary]);

  const handleUploadComplete = (newStatus: any) => {
    setUploadStatus(newStatus);
    setShowUploadSection(false);
    refetchStatus();
  };

  const handleClearUpload = () => {
    setShowUploadSection(true);
  };

  if (!status) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader
        isReady={status?.ready}
        onUploadClick={handleClearUpload}
      />

      <div ref={containerRef} className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Upload Section */}
        {!status?.ready || showUploadSection ? (
          <section data-animate className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">
                {showUploadSection ? "Upload Different Files" : "Get Started"}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {showUploadSection
                  ? "Select new files to replace the current data"
                  : "Upload your billing data files to begin the analysis"}
              </p>
            </div>
            <UploadWidget
              initialStatus={status}
              onUploadComplete={handleUploadComplete}
              onClear={handleClearUpload}
            />
          </section>
        ) : null}

        {/* Loading State */}
        {isLoading && status?.ready && (
          <section data-animate>
            <LoadingSkeleton />
          </section>
        )}

        {/* Ready State - Dashboard */}
        {status?.ready && summary && !isLoading ? (
          <>
            {/* KPI Cards */}
            <section data-animate>
              <h2 className="mb-4 text-lg font-semibold">Overview</h2>
              <KPICards
                errorRates={summary.error_rates}
                maintenanceData={summary.maintenance_sites}
              />
            </section>

            {/* Provider & Company Stats */}
            <section data-animate className="grid gap-6 md:grid-cols-2">
              {/* Bill Range */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Bill Range</h3>
                </div>
                <div className="space-y-4">
                  {summary.bill_range.per_provider?.PEA && (
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-sm font-medium">PEA</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {summary.bill_range.per_provider.PEA.min_month} to{" "}
                        {summary.bill_range.per_provider.PEA.max_month} (
                        {summary.bill_range.per_provider.PEA.n_months} months)
                      </p>
                    </div>
                  )}
                  {summary.bill_range.per_provider?.MEA && (
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-sm font-medium">MEA</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {summary.bill_range.per_provider.MEA.min_month} to{" "}
                        {summary.bill_range.per_provider.MEA.max_month} (
                        {summary.bill_range.per_provider.MEA.n_months} months)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Site Types Distribution */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Site Types</h3>
                </div>
                <div className="space-y-4">
                  {summary.site_types?.PEA && (
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-sm font-medium">PEA</p>
                      <div className="mt-2 space-y-1">
                        {Object.entries(summary.site_types.PEA).map(
                          ([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-muted-foreground">
                                {type}
                              </span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {summary.site_types?.MEA && (
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-sm font-medium">MEA</p>
                      <div className="mt-2 space-y-1">
                        {Object.entries(summary.site_types.MEA).map(
                          ([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-muted-foreground">
                                {type}
                              </span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Data Quality */}
            <section data-animate>
              <h2 className="mb-4 text-lg font-semibold">Data Quality</h2>
              <DataQualityTable duplicates={summary.duplicates} />
            </section>

            {/* Site Trend */}
            <section data-animate>
              <h2 className="mb-4 text-lg font-semibold">Site Trends</h2>
              <div className="mb-4 rounded-lg border border-border bg-card p-4">
                <SiteSearch />
              </div>
              {selectedSiteId && trend ? (
                <TrendChart trend={trend} />
              ) : (
                <div className="rounded-lg border border-border bg-card p-12 text-center">
                  <p className="text-muted-foreground">
                    Search for a site to view its trend
                  </p>
                </div>
              )}
            </section>

            {/* Maintenance Sites */}
            <section data-animate>
              <h2 className="mb-4 text-lg font-semibold">
                Maintenance Sites (Last 6 Months)
              </h2>
              <div className="rounded-lg border border-border bg-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-left font-semibold">
                        Site ID
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Bill Amount
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Last Maintenance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary.maintenance_sites.maintenance_sites_last_6_months.slice(0, 20).map((site, idx) => (
                      <tr key={idx} className="hover:bg-surface">
                        <td className="px-6 py-3 font-mono text-xs">
                          {site.site_id}
                        </td>
                        <td className="px-6 py-3">{site.provider}</td>
                        <td className="px-6 py-3">{site.company}</td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {site.site_type}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {site.bill_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {site.last_maintenance_month}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">
                  Failed to load dashboard
                </h3>
                <p className="mt-1 text-sm text-destructive/70">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
