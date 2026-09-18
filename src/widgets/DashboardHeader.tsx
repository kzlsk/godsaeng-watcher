import { Logo } from "@/shared/ui/Logo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import { getAppToday } from "@/shared/lib/date/getAppToday";

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
  return (
    <div className="flex w-full items-center justify-between border-b-2 border-ink bg-paper-2 px-4 py-3.75 sm:px-6.5 sm:py-4.25">
      <div className="flex items-center gap-3">
        <Logo size="sm" />
        <span className="hidden text-[12.5px] font-semibold text-ink-soft sm:inline">
          {formatAppDate(getAppToday())}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="border-2 border-green-light px-3.25 py-2.25 text-[12.5px] font-bold text-green-light">
          연속 {currentStreak}일
        </span>
        <ThemeToggle />
        <UserAvatar nickname={nickname} className="hidden sm:flex" />
      </div>
    </div>
  );
}
