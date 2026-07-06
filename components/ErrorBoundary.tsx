"use client";

import { ReactNode, useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (error) {
    return (
      fallback?.(error, () => setError(null)) || (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">
                Something went wrong
              </h3>
              <p className="mt-1 text-sm text-destructive/70">{error.message}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 rounded-lg bg-destructive px-3 py-1 text-sm text-destructive-foreground hover:brightness-110"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
