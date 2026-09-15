import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface StatCellProps {
  label: string;
  value: ReactNode;
  valueTone?: "ink" | "green";
  caption?: ReactNode;
  className?: string;
}

export function StatCell({ label, value, valueTone = "ink", caption, className }: StatCellProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-2 border-border-soft px-4.5 py-4 sm:border-r-2 last:border-r-0",
        className,
      )}
    >
      <span className="text-[12px] font-semibold text-ink-soft">{label}</span>
      <span
        className={cn(
          "text-[26px] font-extrabold leading-none tracking-tight",
          valueTone === "green" ? "text-green" : "text-ink",
        )}
      >
        {value}
      </span>
      {caption ? <span className="text-[12px] font-semibold text-ink-soft">{caption}</span> : null}
    </div>
  );
}
