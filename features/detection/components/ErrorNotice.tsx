import { AlertCircle } from "lucide-react";

/** Inline failure card used by every detection panel's error state. */

interface ErrorNoticeProps {
  title: string;
  error: unknown;
  onRetry?: () => void;
}

export function ErrorNotice({ title, error, onRetry }: ErrorNoticeProps) {
  const message = error instanceof Error ? error.message : "Something went wrong.";

  return (
    <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" aria-hidden />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-destructive">{title}</h4>
          <p className="mt-1 text-sm text-destructive/80">{message}</p>
          {onRetry ? (
            <button type="button" onClick={onRetry} className="btn-base btn-secondary mt-3">
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
