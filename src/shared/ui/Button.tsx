import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant =
  | "solid"
  | "outline"
  | "kakao"
  | "google"
  | "cream"
  | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  solid: "bg-ink text-paper-3 border-ink hover:opacity-90",
  outline: "bg-transparent text-ink border-line-strong hover:bg-surface-muted",
  /*
   * 카카오 공식 로그인 버튼 스펙(배경 #FEE500 = yellow 토큰, 라벨 #000000 85%,
   * 테두리 없음, 라운드 모서리)을 그대로 따른다. 배경이 항상 노란색이라
   * 라벨도 테마에 따라 바뀌는 ink 대신 검정으로 고정한다.
   */
  kakao: "rounded-xl bg-yellow text-black/85 border-transparent hover:opacity-90",
  /*
   * 구글 공식 로그인 버튼(라이트 테마) 스펙: 배경 #FFFFFF, 테두리 #747775,
   * 라벨 #1F1F1F, 라운드 모서리, hover는 #303030 8% 오버레이(≈ #EEEEEE).
   * 카카오와 마찬가지로 브랜드 색이라 테마 토큰을 쓰지 않고 고정한다.
   * 테두리만 공식 1px 대신 공통 클래스의 2px을 그대로 쓴다 — cn()이 단순 join이라
   * border-2를 덮어쓰는 게 불안정하고, 카카오 버튼과 높이도 어긋나기 때문.
   */
  google:
    "rounded-xl bg-white text-[#1f1f1f] border-[#747775] hover:bg-[#eeeeee]",
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
