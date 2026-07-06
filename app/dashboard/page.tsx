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
import { AlertCircle, Database, TrendingUp, Search } from "lucide-react";

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

      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-8">
        <div ref={containerRef} className="max-w-7xl mx-auto space-y-8">
          {/* Upload Section */}
          {!status?.ready || showUploadSection ? (
            <section data-animate className="card-base p-8 space-y-6">
              <div>
                <h2 className="text-3xl font-bold">
                  {showUploadSection ? "Upload Different Files" : "Get Started"}
                </h2>
                <p className="mt-3 text-foreground/70 max-w-2xl">
                  {showUploadSection
                    ? "Select new files to replace the current data"
                    : "Upload your billing data files to begin comprehensive analysis"}
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
              <section data-animate className="w-full">
                <h3 className="section-label mb-5">Key Metrics</h3>
                <div className="w-full">
                  <KPICards
                    errorRates={summary.error_rates}
                    maintenanceData={summary.maintenance_sites}
                  />
                </div>
              </section>

              {/* Analysis Section */}
              <section data-animate className="grid gap-6 lg:grid-cols-2">
                {/* Bill Range */}
                <div className="card-base p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-lg">Bill Range</h3>
                  </div>
                  <div className="space-y-3">
                    {summary.bill_range.per_provider?.PEA && (
                      <div className="p-4 rounded-md border border-border bg-surface/50">
                        <p className="text-sm font-semibold text-foreground">PEA</p>
                        <p className="mt-2 text-sm text-muted-foreground font-mono">
                          {summary.bill_range.per_provider.PEA.min_month} → {" "}
                          {summary.bill_range.per_provider.PEA.max_month}
                        </p>
                        <p className="text-xs text-foreground/60 mt-2">
                          {summary.bill_range.per_provider.PEA.n_months} months
                        </p>
                      </div>
                    )}
                    {summary.bill_range.per_provider?.MEA && (
                      <div className="p-4 rounded-md border border-border bg-surface/50">
                        <p className="text-sm font-semibold text-foreground">MEA</p>
                        <p className="mt-2 text-sm text-muted-foreground font-mono">
                          {summary.bill_range.per_provider.MEA.min_month} → {" "}
                          {summary.bill_range.per_provider.MEA.max_month}
                        </p>
                        <p className="text-xs text-foreground/60 mt-2">
                          {summary.bill_range.per_provider.MEA.n_months} months
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Site Types Distribution */}
                <div className="card-base p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center">
                      <Database className="h-5 w-5 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-lg">Site Types</h3>
                  </div>
                  <div className="space-y-3">
                    {summary.site_types?.PEA && (
                      <div className="p-4 rounded-md border border-border bg-surface/50">
                        <p className="text-sm font-semibold text-foreground mb-3">PEA</p>
                        <div className="space-y-2">
                          {Object.entries(summary.site_types.PEA).map(
                            ([type, count]) => (
                              <div
                                key={type}
                                className="flex justify-between items-center text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {type}
                                </span>
                                <span className="font-bold text-foreground">{count}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {summary.site_types?.MEA && (
                      <div className="p-4 rounded-md border border-border bg-surface/50">
                        <p className="text-sm font-semibold text-foreground mb-3">MEA</p>
                        <div className="space-y-2">
                          {Object.entries(summary.site_types.MEA).map(
                            ([type, count]) => (
                              <div
                                key={type}
                                className="flex justify-between items-center text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {type}
                                </span>
                                <span className="font-bold text-foreground">{count}</span>
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
                <h3 className="section-label mb-4">Data Quality</h3>
                <DataQualityTable duplicates={summary.duplicates} />
              </section>

              {/* Site Trend */}
              <section data-animate className="w-full">
                <h3 className="section-label mb-5">Site Analysis</h3>
                <div className="card-base p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium text-foreground">Find a site:</label>
                  </div>
                  <SiteSearch />
                </div>
                {selectedSiteId && trend ? (
                  <TrendChart trend={trend} />
                ) : (
                  <div className="card-base p-12 text-center">
                    <p className="text-muted-foreground">
                      Search for a site to view its trend analysis
                    </p>
                  </div>
                )}
              </section>

              {/* Maintenance Sites */}
              <section data-animate>
                <h3 className="section-label mb-4">Maintenance Records</h3>
                <div className="card-base overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface/50">
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Site ID
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Last Maintenance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {summary.maintenance_sites.maintenance_sites_last_6_months
                        .slice(0, 10)
                        .map((site, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-surface/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                              {site.site_id}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {site.provider}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {site.company}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {site.site_type}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-primary">
                              {site.bill_amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
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
            <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6">
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
      </div>
    </main>
  );
}
