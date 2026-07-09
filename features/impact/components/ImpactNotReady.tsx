import Link from "next/link";
import { ArrowRight, Banknote } from "lucide-react";

/** Empty state while the pipeline upstream of /impact isn't complete:
 *  impact needs uploaded data, a built model AND a classification. */

export function ImpactNotReady() {
  return (
    <div className="card-base flex flex-col items-center gap-4 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Banknote className="h-6 w-6 text-primary" aria-hidden />
      </div>
      <div className="max-w-md space-y-1">
        <h2 className="text-lg font-semibold text-foreground">No classified anomalies yet</h2>
        <p className="text-sm text-muted-foreground">
          The cost estimate is computed from classified spike-up anomalies. Upload the billing
          files, build a model, and run the classification on the Detector page — then come back
          here.
        </p>
      </div>
      <Link href="/detector" className="btn-base btn-primary">
        Open the Detector
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
