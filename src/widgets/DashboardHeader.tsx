"use client";

import { Logo } from "@/shared/ui/Logo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { getAppToday } from "@/shared/lib/date/getAppToday";
import { useLogout } from "@/features/logout/model/useLogout";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// getAppToday()가 반환하는 "YYYY-MM-DD"(새벽 2시/KST 컷오프 기준 오늘)를 한국어 날짜로
// 포맷한다. 서버 실행 타임존에 따라 결과가 달라지는 Date의 로컬 getter(getMonth 등) 대신
// 문자열을 UTC 자정으로 해석해 UTC getter로 읽어서, 실행 환경(로컬/Vercel 등)과 무관하게
// 항상 같은 결과가 나오게 한다.
export function formatAppDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 ${WEEKDAYS[date.getUTCDay()]}`;
}

interface DashboardHeaderProps {
  currentStreak: number;
  nickname: string;
}

export function DashboardHeader({
  currentStreak,
  nickname,
}: DashboardHeaderProps) {
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onError: () => window.alert("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요."),
    });
  }

  return (
    <div className="flex w-full items-center justify-between border-b-2 border-line bg-paper-2 px-4 py-3.75 sm:px-6.5 sm:py-4.25">
      <div className="flex items-center gap-3">
        <Logo size="sm" />
        <span className="hidden text-[12.5px] font-semibold text-ink-soft sm:inline">
          {formatAppDate(getAppToday())}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* 닉네임은 잘라내지 않고 전체를 그대로 표시한다. */}
        <span
          className="hidden whitespace-nowrap border-2 border-line px-3.25 py-2.25 text-[12.5px] font-bold text-ink sm:inline-block"
          title={nickname}
        >
          {nickname}
        </span>
        <span className="border-2 border-green-light px-3.25 py-2.25 text-[12.5px] font-bold text-green-light">
          연속 {currentStreak}일
        </span>
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          disabled={logout.isPending}
          className="inline-flex items-center gap-1.5 whitespace-nowrap border-2 border-ink bg-ink px-3.25 py-2.25 text-[12.5px] font-bold text-paper-3 transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="size-3.5" aria-hidden="true">
            <path d="M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10" strokeLinecap="square" />
          </svg>
          {logout.isPending ? "로그아웃 중…" : "로그아웃"}
        </button>
      </div>
    </div>
  );
}
