import { cn } from "@/shared/lib/cn";

interface LogoProps {
  size?: "sm" | "md";
  tone?: "ink" | "paper";
  className?: string;
}

export function Logo({ size = "md", tone = "ink", className }: LogoProps) {
  const boxSize = size === "md" ? "size-8 text-[13px]" : "size-7 text-[9px]";
  const textSize = size === "md" ? "text-[19px]" : "text-[15px]";
  const boxTone = tone === "ink" ? "border-ink bg-red-shadow text-paper-3" : "border-paper-3 bg-red text-paper-3";
  const textTone = tone === "ink" ? "text-ink" : "text-paper-3";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("flex items-center justify-center border-2 font-bold", boxSize, boxTone)}>
        G
      </div>
      <span className={cn("font-display", textSize, textTone)}>갓생 감시자</span>
    </div>
  );
}
