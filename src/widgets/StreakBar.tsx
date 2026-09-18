"use client";

import { Panel } from "@/shared/ui/Card";
import { StreakDots } from "@/entities/streak/ui/StreakDots";
import { useStreak } from "@/entities/streak/model/useStreak";

export function StreakBar() {
  const { data: streak } = useStreak();

  if (!streak) {
    return <div className="h-32.5 w-full animate-pulse border-2 border-ink bg-surface-muted" />;
  }

  const remaining = Math.max(0, streak.last7Days.filter((day) => !day).length - 1);

  return (
    <Panel className="flex w-full flex-col gap-2.75 border-green-deep px-5 py-4.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-[18px] text-ink">스트릭</span>
        <span className="text-[13px] font-bold text-green-deep">{streak.currentStreak}일 유지 중</span>
      </div>

      <StreakDots days={streak.last7Days} />

      <p className="text-[12px] font-semibold text-ink-soft">
        {streak.isTodayPending && streak.potentialStreak !== undefined
          ? `오늘 완료 시 ${streak.potentialStreak}일이 됩니다.`
          : `오늘 남은 ${remaining}개 중 하나만 끝내도 기록은 이어집니다.`}
      </p>
    </Panel>
  );
}
