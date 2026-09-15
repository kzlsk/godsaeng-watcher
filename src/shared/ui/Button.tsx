import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant = "solid" | "outline" | "kakao" | "google" | "cream" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  solid: "bg-ink text-paper-3 border-ink hover:opacity-90",
  outline: "bg-transparent text-ink border-ink hover:bg-surface-muted",
  kakao: "bg-yellow text-ink border-ink hover:opacity-90",
  google: "bg-paper text-ink border-ink hover:bg-surface-muted",
  cream: "bg-paper-3 text-red-shadow border-paper-3 hover:opacity-90",
  ghost: "bg-transparent text-ink-soft border-transparent hover:text-ink",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.75 text-[12px]",
  md: "px-4 py-3.25 text-[13.5px]",
  lg: "px-4.25 py-4.5 text-[14.5px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "solid",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
