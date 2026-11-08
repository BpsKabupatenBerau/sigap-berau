"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e1e8f0] bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
        <span className="h-7 w-7 rounded-md bg-slate-100 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div
      className="flex h-9 items-center gap-0.5 rounded-lg border border-[#e1e8f0] bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/80"
      role="group"
      aria-label="Pengaturan Tema Tampilan"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        title="Tema Terang"
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
          theme === "light"
            ? "bg-white text-[#10345b] shadow-sm dark:bg-slate-700 dark:text-white"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Terang</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        title="Tema Gelap"
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
          theme === "dark"
            ? "bg-[#10345b] text-white shadow-sm dark:bg-blue-600 dark:text-white"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Gelap</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        title="Tema Sistem"
        className={cn(
          "flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors",
          theme === "system"
            ? "bg-white text-[#10345b] shadow-sm dark:bg-slate-700 dark:text-white"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        )}
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

