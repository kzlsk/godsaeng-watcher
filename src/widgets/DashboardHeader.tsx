import { Logo } from "@/shared/ui/Logo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { formatKoreanDate } from "@/shared/lib/date";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";

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
          {formatKoreanDate(new Date())}
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
