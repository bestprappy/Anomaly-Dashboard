"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { AlertCircle, Radar } from "lucide-react";

import { api } from "@/lib/api";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DetectionTab, detectionTabAtom } from "@/features/detection/atoms";
import { AbnormalResultsPanel } from "@/features/detection/components/AbnormalResultsPanel";
import { AnomalyTrendPanel } from "@/features/detection/components/AnomalyTrendPanel";
import { BuildModelPanel } from "@/features/detection/components/BuildModelPanel";
import { ClassifyPanel } from "@/features/detection/components/ClassifyPanel";
import { DropOptionsPanel } from "@/features/detection/components/DropOptionsPanel";
import { ExamplesGallery } from "@/features/detection/components/ExamplesGallery";
import { PreviewPanel } from "@/features/detection/components/PreviewPanel";
import { SeverityDurationMatrix } from "@/features/detection/components/SeverityDurationMatrix";
import { StepSection } from "@/features/detection/components/StepSection";
import { TrainTestRangePanel } from "@/features/detection/components/TrainTestRangePanel";
import { useAbnormalAnomalies } from "@/features/detection/hooks";

/**
 * Detection page: Process (filter -> window -> preview -> build -> flags)
 * and Result (classify -> severity/duration matrix -> example plots). Pure composition — all logic
 * lives in the detection feature.
 */

export default function DetectorPage() {
  const [tab, setTab] = useAtom(detectionTabAtom);

  const { data: uploadStatus } = useQuery({
    queryKey: ["uploadStatus"],
    queryFn: () => api.getUploadStatus(),
  });

  // Shares the abnormal query with the results panel (deduped by key);
  // non-null data means the server currently holds a built model.
  const { data: abnormal } = useAbnormalAnomalies();
  const modelReady = abnormal !== null && abnormal !== undefined;

  const dataReady = uploadStatus?.ready === true;
  const dataKnown = uploadStatus !== undefined;

  const handleTabChange = useCallback(
    (value: string) => setTab(value as DetectionTab),
    [setTab]
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Radar className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Anomaly Detection</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground">
                Fit a quantile-band model on the uploaded billing data, flag site-months with
                unusual kWh, then classify and inspect the jumps.
              </p>
            </div>
          </header>

          {dataKnown && !dataReady ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" aria-hidden />
              <div>
                <h2 className="text-base font-semibold text-warning">Billing data not loaded</h2>
                <p className="mt-1 text-sm text-warning/80">
                  The detector needs all five billing files.{" "}
                  <Link href="/dashboard" className="font-semibold underline underline-offset-2">
                    Upload them on the Dashboard
                  </Link>{" "}
                  first — preview and build are disabled until then.
                </p>
              </div>
            </div>
          ) : null}

          <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
            <Tabs.List aria-label="Detection workflow">
              <Tabs.Trigger value="process">Process</Tabs.Trigger>
              <Tabs.Trigger value="result">Result</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Panel value="process" className="space-y-6">
              <ErrorBoundary>
                <StepSection
                  step={1}
                  title="Site filters"
                  description="Exclude unreliable site categories before fitting."
                >
                  <DropOptionsPanel />
                </StepSection>

                <StepSection
                  step={2}
                  title="Date windows"
                  description="Choose the months the model trains on and the months it scans."
                >
                  <TrainTestRangePanel />
                </StepSection>

                <StepSection
                  step={3}
                  title="Data quality preview"
                  description="Check what gets dropped and how much data is missing — before building."
                >
                  <PreviewPanel disabled={!dataReady} />
                </StepSection>

                <StepSection
                  step={4}
                  title="Build model"
                  description="Fit the quantile band and flag site-months outside it."
                >
                  <BuildModelPanel disabled={!dataReady} />
                </StepSection>

                <StepSection
                  step={5}
                  title="Flagged anomalies"
                  description="Every site-month whose kWh fell outside the prediction band. Click a site ID to see its trend below."
                >
                  <AbnormalResultsPanel />
                </StepSection>

                <StepSection
                  step={6}
                  title="Site trend"
                  description="Full kWh and bill history of the selected site, with the flagged month pinged."
                >
                  <AnomalyTrendPanel />
                </StepSection>
              </ErrorBoundary>
            </Tabs.Panel>

            <Tabs.Panel value="result" className="space-y-6">
              <ErrorBoundary>
                <StepSection
                  step={1}
                  title="Classify anomalies"
                  description="Split the flags into spikes and sustained steps with your own thresholds. Click a site ID to see its trend below."
                >
                  <ClassifyPanel modelReady={modelReady} />
                </StepSection>

                <StepSection
                  step={2}
                  title="Site trend"
                  description="Full kWh and bill history of the selected site, with the flagged month pinged."
                >
                  <AnomalyTrendPanel />
                </StepSection>

                <StepSection
                  step={3}
                  title="Severity and duration matrix"
                  description="Group confirmed events into nine cells and check whether duration agrees with the spike/step intuition."
                >
                  <SeverityDurationMatrix />
                </StepSection>

                <StepSection
                  step={4}
                  title="Example plots"
                  description="Server-rendered kWh trends of classified sites, with the anomaly marked."
                >
                  <ExamplesGallery />
                </StepSection>
              </ErrorBoundary>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
