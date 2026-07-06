"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function LoadingSkeleton() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const skeletons = containerRef.current.querySelectorAll("[data-skeleton]");
    gsap.to(skeletons, {
      duration: 1.2,
      opacity: 0.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <div ref={containerRef} className="space-y-8">
      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            data-skeleton
            className="h-24 rounded-lg border border-border bg-surface animate-pulse"
          />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <div
              data-skeleton
              className="h-8 w-32 rounded bg-surface animate-pulse"
            />
            <div
              data-skeleton
              className="mt-6 h-64 w-full rounded bg-surface animate-pulse"
            />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div
        data-skeleton
        className="h-96 rounded-lg border border-border bg-surface animate-pulse"
      />
    </div>
  );
}
