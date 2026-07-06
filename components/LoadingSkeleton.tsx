"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function LoadingSkeleton() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const skeletons = containerRef.current.querySelectorAll("[data-skeleton]");
    gsap.to(skeletons, {
      duration: 1.5,
      opacity: 0.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <div ref={containerRef} className="space-y-8">
      {/* KPI Cards Skeleton */}
      <div>
        <div className="h-4 w-32 rounded bg-muted mb-4 animate-pulse" data-skeleton />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              data-skeleton
              className="h-24 rounded-md border border-border bg-surface"
            />
          ))}
        </div>
      </div>

      {/* Analysis Section Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card-base p-6">
            <div
              data-skeleton
              className="h-6 w-24 rounded bg-surface"
            />
            <div
              data-skeleton
              className="mt-6 h-32 w-full rounded bg-surface"
            />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="card-base p-6">
        <div
          data-skeleton
          className="h-6 w-32 rounded bg-surface mb-4"
        />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} data-skeleton className="h-12 rounded bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
