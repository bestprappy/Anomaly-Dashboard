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

      {/* Main Content - Full Width */}
      <div className="pt-24 pb-12 px-8">
        <div ref={containerRef} className="max-w-7xl mx-auto space-y-8">
          {/* Upload Section */}
          {!status?.ready || showUploadSection ? (
            <section data-animate className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {showUploadSection ? "Upload Different Files" : "Get Started"}
                </h2>
                <p className="mt-2 text-muted-foreground">
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
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Key Metrics
                </h2>
                <KPICards
                  errorRates={summary.error_rates}
                  maintenanceData={summary.maintenance_sites}
                />
              </section>

              {/* Analysis Section */}
              <section data-animate className="grid gap-6 lg:grid-cols-2">
                {/* Bill Range */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-blue-400/5 backdrop-blur-xl p-6 shadow-xl">
                  <div className="mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    <h3 className="font-semibold">Bill Range</h3>
                  </div>
                  <div className="space-y-3">
                    {summary.bill_range.per_provider?.PEA && (
                      <div className="rounded-xl bg-gradient-to-br from-purple-600/30 to-purple-500/10 border border-purple-400/20 p-4">
                        <p className="text-sm font-semibold text-purple-200">PEA</p>
                        <p className="mt-2 text-xs text-purple-300/70">
                          {summary.bill_range.per_provider.PEA.min_month} to{" "}
                          {summary.bill_range.per_provider.PEA.max_month}
                        </p>
                        <p className="text-xs text-purple-300 font-bold mt-2">
                          {summary.bill_range.per_provider.PEA.n_months} months
                        </p>
                      </div>
                    )}
                    {summary.bill_range.per_provider?.MEA && (
                      <div className="rounded-xl bg-gradient-to-br from-cyan-600/30 to-cyan-500/10 border border-cyan-400/20 p-4">
                        <p className="text-sm font-semibold text-cyan-200">MEA</p>
                        <p className="mt-2 text-xs text-cyan-300/70">
                          {summary.bill_range.per_provider.MEA.min_month} to{" "}
                          {summary.bill_range.per_provider.MEA.max_month}
                        </p>
                        <p className="text-xs text-cyan-300 font-bold mt-2">
                          {summary.bill_range.per_provider.MEA.n_months} months
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Site Types Distribution */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-orange-400/5 backdrop-blur-xl p-6 shadow-xl">
                  <div className="mb-6 flex items-center gap-2">
                    <Database className="h-5 w-5 text-orange-400" />
                    <h3 className="font-semibold">Site Types</h3>
                  </div>
                  <div className="space-y-3">
                    {summary.site_types?.PEA && (
                      <div className="rounded-xl bg-gradient-to-br from-emerald-600/30 to-emerald-500/10 border border-emerald-400/20 p-4">
                        <p className="text-sm font-semibold text-emerald-200 mb-3">PEA</p>
                        <div className="space-y-2">
                          {Object.entries(summary.site_types.PEA).map(
                            ([type, count]) => (
                              <div
                                key={type}
                                className="flex justify-between items-center text-xs"
                              >
                                <span className="text-emerald-300/70">
                                  {type}
                                </span>
                                <span className="font-bold text-emerald-300">{count}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {summary.site_types?.MEA && (
                      <div className="rounded-xl bg-gradient-to-br from-pink-600/30 to-pink-500/10 border border-pink-400/20 p-4">
                        <p className="text-sm font-semibold text-pink-200 mb-3">MEA</p>
                        <div className="space-y-2">
                          {Object.entries(summary.site_types.MEA).map(
                            ([type, count]) => (
                              <div
                                key={type}
                                className="flex justify-between items-center text-xs"
                              >
                                <span className="text-pink-300/70">
                                  {type}
                                </span>
                                <span className="font-bold text-pink-300">{count}</span>
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
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Data Quality
                </h2>
                <DataQualityTable duplicates={summary.duplicates} />
              </section>

              {/* Site Trend */}
              <section data-animate>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Site Analysis
                </h2>
                <div className="mb-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-900/20 backdrop-blur-xl p-4 shadow-lg">
                  <SiteSearch />
                </div>
                {selectedSiteId && trend ? (
                  <TrendChart trend={trend} />
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-900/20 backdrop-blur-xl p-12 text-center shadow-lg">
                    <p className="text-muted-foreground">
                      Search for a site to view its trend
                    </p>
                  </div>
                )}
              </section>

              {/* Maintenance Sites */}
              <section data-animate>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Maintenance Records
                </h2>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-900/20 backdrop-blur-xl overflow-hidden shadow-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-900/40">
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase text-blue-300">
                          Site ID
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase text-blue-300">
                          Provider
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase text-blue-300">
                          Company
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase text-blue-300">
                          Type
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-xs uppercase text-blue-300">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase text-blue-300">
                          Last Maintenance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {summary.maintenance_sites.maintenance_sites_last_6_months
                        .slice(0, 10)
                        .map((site, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-xs font-semibold text-purple-300">
                              {site.site_id}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {site.provider}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {site.company}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {site.site_type}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-cyan-300">
                              {site.bill_amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
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
