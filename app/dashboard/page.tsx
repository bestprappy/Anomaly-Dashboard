"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { api } from "@/lib/api";
import { UploadQueueWidget } from "@/components/UploadQueueWidget";
import { KPICards } from "@/components/KPICards";
import { BillRangeChart } from "@/components/BillRangeChart";
import { SiteTypesChart } from "@/components/SiteTypesChart";
import { TrendChart } from "@/components/TrendChart";
import { SiteSearch, SITE_SEARCH_INPUT_ID } from "@/components/SiteSearch";
import { SiteDirectory } from "@/components/SiteDirectory";
import { useSites } from "@/lib/useSites";
import { DataQualityTable } from "@/components/DataQualityTable";
import { MaintenanceRecordsTable } from "@/components/MaintenanceRecordsTable";
import { BillPatternsTable } from "@/components/BillPatternsTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useAtom, useSetAtom } from "jotai";
import { selectedSiteIdAtom, siteSearchAtom } from "@/lib/atoms";
import { AlertCircle, Search } from "lucide-react";

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteAnalysisRef = useRef<HTMLElement>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useAtom(selectedSiteIdAtom);
  const setSiteSearchQuery = useSetAtom(siteSearchAtom);

  const {
    data: status,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["uploadStatus"],
    queryFn: () => api.getUploadStatus(),
    staleTime: 0,
    retry: 2,
    refetchOnMount: "always",
  });

  const hasUploadedData = (status?.loaded_files.length ?? 0) > 0;
  const hasCompleteData = status?.ready === true;

  const { data: sitesData } = useSites(undefined, hasUploadedData);
  const exampleSites = sitesData?.site_ids.slice(0, 3) ?? [];

  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    setSiteSearchQuery(siteId);
    siteAnalysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ["edaSummary"],
    queryFn: () => api.getEDASummary(),
    enabled: hasUploadedData,
    staleTime: 0,
    retry: 1,
    refetchOnMount: "always",
  });

  const {
    data: meterPatterns,
    error: meterPatternsError,
    isLoading: isMeterPatternsLoading,
  } = useQuery({
    queryKey: ["meterPatterns"],
    queryFn: () => api.getMeterPatterns(),
    enabled: hasUploadedData,
    staleTime: 0,
    retry: 1,
    refetchOnMount: "always",
  });

  const {
    data: trend,
    error: trendError,
    isLoading: isTrendLoading,
  } = useQuery({
    queryKey: ["siteTrend", selectedSiteId, "kwh-billing"],
    queryFn: () => api.getSiteTrendBundle(selectedSiteId!),
    enabled: Boolean(selectedSiteId && hasUploadedData),
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
        // Leftover inline transforms turn each section into a stacking
        // context, which lets later sections paint over the site-search
        // dropdown. Clear them once the entry animation finishes.
        clearProps: "opacity,transform",
      });
    }
  }, [summary]);

  const handleUploadComplete = () => {
    setShowUploadSection(false);
    refetchStatus();
  };

  const handleClearUpload = () => {
    setShowUploadSection(true);
  };

  if (!status && statusError) {
    return (
      <main className="min-h-screen bg-background">
        <DashboardHeader isReady={false} onUploadClick={handleClearUpload} />
        <div className="px-4 pb-16 pt-24 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <div>
                  <h2 className="font-semibold text-destructive">Dashboard did not load</h2>
                  <p className="mt-1 text-sm text-destructive/80">
                    {statusError instanceof Error
                      ? statusError.message
                      : "The API did not return upload status."}
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetchStatus()}
                    className="btn-base btn-secondary mt-4"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!status || isStatusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader
        isReady={hasUploadedData}
        onUploadClick={handleClearUpload}
      />

      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-8">
        <div ref={containerRef} className="max-w-7xl mx-auto space-y-8">
          {/* Upload Section */}
          {!hasUploadedData || showUploadSection ? (
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
              <UploadQueueWidget
                initialStatus={status}
                onUploadComplete={handleUploadComplete}
              />
            </section>
          ) : null}

          {hasUploadedData && !hasCompleteData && !showUploadSection ? (
            <section
              data-animate
              className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
              <div>
                <h3 className="font-semibold text-warning">Partial data loaded</h3>
                <p className="mt-1 text-sm text-warning/80">
                  Showing analysis from {status.loaded_files.length} uploaded{" "}
                  {status.loaded_files.length === 1 ? "file" : "files"}. Missing:{" "}
                  {status.missing_files.join(", ")}
                </p>
              </div>
            </section>
          ) : null}

          {/* Loading State */}
          {isLoading && hasUploadedData && (
            <section data-animate>
              <LoadingSkeleton />
            </section>
          )}

          {/* Data State - Dashboard */}
          {hasUploadedData && summary && !isLoading ? (
            <>
              {/* KPI Cards */}
              <section data-animate className="w-full">
                <h3 className="section-label mb-5">Key Metrics</h3>
                <div className="w-full">
                  <KPICards
                    errorRates={summary.error_rates}
                    maintenanceData={summary.maintenance_sites}
                    meterPatterns={meterPatterns}
                  />
                </div>
              </section>

              {/* Analysis Section */}
              <section data-animate className="grid gap-6 lg:grid-cols-2">
                <BillRangeChart billRange={summary.bill_range} />
                <SiteTypesChart siteTypes={summary.site_types} />
              </section>

              {/* Data Quality */}
              <section data-animate>
                <h3 className="section-label mb-4">Data Quality</h3>
                <DataQualityTable duplicates={summary.duplicates} />
              </section>

              {/* Site Trend */}
              <section ref={siteAnalysisRef} data-animate className="w-full scroll-mt-24">
                <h3 className="section-label mb-5">Site Analysis</h3>
                <div className="card-base p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <label
                      htmlFor={SITE_SEARCH_INPUT_ID}
                      className="text-sm font-medium text-foreground"
                    >
                      Find a site:
                    </label>
                  </div>
                  <SiteSearch />
                </div>
                {selectedSiteId && isTrendLoading ? (
                  <div className="card-base p-12 text-center">
                    <p className="text-muted-foreground">Loading site analysis...</p>
                  </div>
                ) : selectedSiteId && trendError ? (
                  <div
                    role="alert"
                    className="card-base border-destructive/40 bg-destructive/10 p-6"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                      <div>
                        <h4 className="font-semibold text-destructive">
                          Site analysis did not load
                        </h4>
                        <p className="mt-1 text-sm text-destructive/80">
                          {trendError instanceof Error
                            ? trendError.message
                            : "The API did not return site trend data."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedSiteId && trend ? (
                  <TrendChart trend={trend} />
                ) : (
                  <div className="card-base p-12 text-center">
                    <p className="text-muted-foreground">
                      Search or pick a site below to view its trend analysis
                    </p>
                    {exampleSites.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Try one of these:
                        </span>
                        {exampleSites.map((siteId) => (
                          <button
                            key={siteId}
                            type="button"
                            onClick={() => handleSiteSelect(siteId)}
                            className="cursor-pointer rounded-md border border-border bg-surface/50 px-3 py-1.5 font-mono text-xs text-primary outline-none transition-colors hover:border-primary/40 hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            {siteId}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <SiteDirectory onSelect={handleSiteSelect} />
                </div>
              </section>

              {/* Bill Patterns (last 3 months per meter) */}
              <section data-animate>
                <h3 className="section-label mb-4">
                  Bill Patterns — Last {meterPatterns?.window ?? 3} Months
                </h3>
                {isMeterPatternsLoading ? (
                  <div className="card-base p-12 text-center">
                    <p className="text-muted-foreground">
                      Analyzing meter bill patterns...
                    </p>
                  </div>
                ) : meterPatternsError ? (
                  <div
                    role="alert"
                    className="card-base border-destructive/40 bg-destructive/10 p-6"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                      <div>
                        <h4 className="font-semibold text-destructive">
                          Bill patterns did not load
                        </h4>
                        <p className="mt-1 text-sm text-destructive/80">
                          {meterPatternsError instanceof Error
                            ? meterPatternsError.message
                            : "The API did not return meter pattern data."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : meterPatterns ? (
                  <BillPatternsTable
                    data={meterPatterns}
                    onSiteSelect={handleSiteSelect}
                  />
                ) : null}
              </section>

              {/* Maintenance Sites */}
              <section data-animate>
                <h3 className="section-label mb-4">Maintenance Records</h3>
                <MaintenanceRecordsTable
                  records={
                    summary.maintenance_sites.maintenance_sites_last_6_months
                  }
                  onSiteSelect={handleSiteSelect}
                />
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
