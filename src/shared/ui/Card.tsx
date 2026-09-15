import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type CardShadow = "ink" | "red" | "none";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  shadow?: CardShadow;
}

const shadowClasses: Record<CardShadow, string> = {
  ink: "shadow-brut",
  red: "shadow-brut-red",
  none: "",
};

export function Card({ shadow = "ink", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border-2 border-ink bg-paper-2 p-0.5",
        shadowClasses[shadow],
        className,
      )}
      {...props}
    >
      <div className="size-full bg-surface">{children}</div>
    </div>
  );
}

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-2 border-ink bg-paper-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}
