import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type BadgeVariant = "success" | "danger" | "solid" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  success: "border-green text-green",
  danger: "border-red-shadow text-red-shadow",
  solid: "border-ink bg-ink text-paper-3",
  neutral: "border-ink text-ink",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center border-2 px-2.5 py-1.75 text-[11px] font-bold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
