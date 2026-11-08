import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#10345b] text-white dark:bg-blue-600",
        secondary:
          "border-[#d0e2ff] bg-[#ebf3ff] text-[#1557b0] dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        teal:
          "border-[#b2ebe5] bg-[#e6f7f5] text-[#087f80] dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
        outline:
          "border-[#e1e8f0] bg-white text-[#142b45] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

