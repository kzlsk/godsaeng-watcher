"use client";

import { Panel } from "@/shared/ui/Card";
import { StatCell } from "@/shared/ui/StatCell";
import { Badge } from "@/shared/ui/Badge";
import { ProgressBar } from "@/shared/ui/ProgressBar";
import { useMissions } from "@/entities/mission/model/useMissions";
import { MissionItem } from "@/entities/mission/ui/MissionItem";
import { useDailyStats } from "@/entities/checkin/model/useDailyStats";
import { useStreak } from "@/entities/streak/model/useStreak";
import { useToggleMission } from "@/features/toggle-mission/model/useToggleMission";
import { useStartFocusSession } from "@/features/start-focus-session/model/useStartFocusSession";

export function MissionBoard({ onOpenAddMission }: { onOpenAddMission: () => void }) {
  const { data: missions = [] } = useMissions();
  const { data: stats } = useDailyStats();
  const { data: streak } = useStreak();
  const toggleMission = useToggleMission();
  const startFocusSession = useStartFocusSession();

  const completedCount = missions.filter((mission) => mission.isCompleted).length;
  const totalCount = missions.length;
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  function handleToggle(id: string, next: boolean) {
    toggleMission.mutate({ id, isCompleted: next });
  }

  return (
    <div className="flex w-full flex-col gap-4.5">
      <Panel className="flex flex-col divide-y-2 divide-border-soft sm:flex-row sm:divide-x-2 sm:divide-y-0">
        <StatCell label="오늘 완료율" value={`${completionRate}%`} caption={`${completedCount}/${totalCount}`} />
        <StatCell
          label="총 집중 시간"
          value={stats ? `${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m` : "—"}
          caption={stats ? `예상보다 ${stats.focusAheadMinutes}분 빠름` : undefined}
        />
        <StatCell
          label="지연 누적"
          value={stats ? `${stats.delayMinutesToday}분` : "—"}
          caption={stats ? `이번 주 미룬 시간 ${stats.delayMinutesWeek}분` : undefined}
        />
        <StatCell
          label="주간 점수"
          value={streak ? `${streak.weeklyScore}점` : "—"}
          valueTone="green"
          caption={streak ? `+${streak.weeklyScoreDelta} 지난주 대비` : undefined}
        />
      </Panel>

      <Panel className="w-full">
        <div className="flex items-center justify-between border-b-2 border-ink px-5 py-4">
          <span className="font-display text-[19px] text-ink">오늘의 미션</span>
          <Badge variant="success">{completedCount} / {totalCount} 완료</Badge>
        </div>

        <div className="flex flex-col">
          {missions.map((mission) => (
            <MissionItem
              key={mission.id}
              mission={mission}
              onToggle={() => handleToggle(mission.id, !mission.isCompleted)}
              onStartFocus={() => startFocusSession.mutate({ missionId: mission.id, action: "start" })}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenAddMission}
          className="m-5 mt-6.25 border-2 border-ink py-3.25 text-[13px] font-bold text-ink"
        >
          + 미션 추가
        </button>
      </Panel>

      {totalCount > 0 ? <ProgressBar value={completionRate} className="sm:hidden" /> : null}
    </div>
  );
}
