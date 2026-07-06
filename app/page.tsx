"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Gauge, RefreshCw, TrendingUp } from "lucide-react";

import { AnomalyChart } from "@/components/anomaly-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateSeries, summarize, type Severity } from "@/lib/anomaly-data";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const percentFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const severityBadge: Record<Severity, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  normal: "outline",
};

export default function Dashboard() {
  const [seed, setSeed] = useState(42);

  const points = useMemo(() => generateSeries(seed), [seed]);
  const summary = useMemo(() => summarize(points), [points]);
  const anomalies = useMemo(
    () => points.filter((p) => p.isAnomaly).sort((a, b) => b.score - a.score),
    [points],
  );

  const stats = [
    {
      label: "Data points",
      value: summary.total.toString(),
      hint: "Last 24h · 15-min buckets",
      icon: Activity,
    },
    {
      label: "Anomalies",
      value: summary.anomalies.toString(),
      hint: `${summary.critical} critical`,
      icon: AlertTriangle,
    },
    {
      label: "Anomaly rate",
      value: percentFmt.format(summary.anomalyRate),
      hint: "Share of flagged buckets",
      icon: Gauge,
    },
    {
      label: "Peak value",
      value: summary.peakValue.toLocaleString(),
      hint: `Max score ${summary.maxScore.toFixed(2)}`,
      icon: TrendingUp,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            Observability
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Anomaly Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Detected anomalies for{" "}
            <span className="text-foreground font-medium">{summary.metric}</span>{" "}
            over the last 24 hours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="border-input bg-card hover:bg-accent inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-sm transition-colors"
        >
          <RefreshCw className="size-4" />
          Resample
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <stat.icon className="size-4" />
                {stat.label}
              </CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Signal timeline</CardTitle>
          <CardDescription>
            Anomalous buckets are marked —{" "}
            <span className="text-destructive font-medium">red</span> critical,{" "}
            <span className="text-chart-3 font-medium">amber</span> warning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnomalyChart points={points} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Flagged anomalies</CardTitle>
          <CardDescription>
            {anomalies.length} buckets ranked by anomaly score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {anomalies.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No anomalies in this window.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((p) => (
                  <TableRow key={p.index}>
                    <TableCell className="font-medium tabular-nums">
                      {timeFmt.format(p.timestamp)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {summary.metric}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.value.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.score.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={severityBadge[p.severity]}
                        className="capitalize"
                      >
                        {p.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
