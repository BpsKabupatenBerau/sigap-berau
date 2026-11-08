import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#10345b] text-white hover:bg-[#142b45] dark:bg-[#1557b0] dark:hover:bg-blue-700",
        teal:
          "bg-[#087f80] text-white hover:bg-[#066667]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-[#e1e8f0] bg-white text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        secondary:
          "bg-[#ebf3ff] text-[#1557b0] hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-300",
        ghost:
          "text-[#142b45] hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
        link: "text-[#1557b0] underline-offset-4 hover:underline dark:text-blue-400",
      },
      size: {
        default: "h-[42px] px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-[50px] rounded-[8px] px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

