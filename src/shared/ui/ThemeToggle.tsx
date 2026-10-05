"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem("godsaeng-theme", theme);
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("godsaeng-theme");
  return stored === "dark" ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function select(next: Theme) {
    setTheme(next);
  }

  return (
    <div className={cn("inline-flex min-h-9 items-stretch border-2 border-line-strong p-0.5", className)}>
      <button
        type="button"
        onClick={() => select("light")}
        className={cn(
          "flex items-center px-2.5 text-[11px] font-bold",
          theme === "light" ? "bg-ink text-paper-3" : "text-ink-soft",
        )}
      >
        라이트
      </button>
      <button
        type="button"
        onClick={() => select("dark")}
        className={cn(
          "flex items-center px-2.5 text-[11px] font-bold",
          theme === "dark" ? "bg-ink text-paper-3" : "text-ink-soft",
        )}
      >
        다크
      </button>
    </div>
  );
}
