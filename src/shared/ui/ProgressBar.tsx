import { cn } from "@/shared/lib/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: "ink" | "green";
  className?: string;
}

export function ProgressBar({ value, max = 100, tone = "ink", className }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("h-1.5 w-full bg-border-soft-2", className)}>
      <div
        className={cn("h-full", tone === "green" ? "bg-green" : "bg-ink")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
