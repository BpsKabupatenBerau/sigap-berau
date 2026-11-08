import * as React from "react";
import { cn } from "@/lib/utils";

export function ProgressBar({
  percentage,
  colorClass = "bg-[#087f80]",
  trackClass = "bg-slate-100 dark:bg-slate-800",
}: {
  percentage: number;
  colorClass?: string;
  trackClass?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  const widthClassMap: Record<number, string> = {
    0: "w-0",
    5: "w-[5%]",
    10: "w-[10%]",
    15: "w-[15%]",
    20: "w-[20%]",
    25: "w-1/4",
    30: "w-[30%]",
    33: "w-1/3",
    35: "w-[35%]",
    40: "w-2/5",
    45: "w-[45%]",
    50: "w-1/2",
    55: "w-[55%]",
    60: "w-3/5",
    65: "w-[65%]",
    67: "w-2/3",
    70: "w-[70%]",
    75: "w-3/4",
    80: "w-4/5",
    85: "w-[85%]",
    90: "w-[90%]",
    95: "w-[95%]",
    100: "w-full",
  };

  // Snap to nearest bucket so we never use inline styles
  const buckets = Object.keys(widthClassMap).map(Number);
  const nearest = buckets.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  );

  return (
    <div
      className={cn(
        "h-[6px] w-full overflow-hidden rounded-full",
        trackClass
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          colorClass,
          widthClassMap[nearest]
        )}
      />
    </div>
  );
}

