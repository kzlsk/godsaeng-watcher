"use client";

import { Panel } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { ProgressBar } from "@/shared/ui/ProgressBar";
import { useMissions } from "@/entities/mission/model/useMissions";
import { MissionItem } from "@/entities/mission/ui/MissionItem";
import { useToggleMission } from "@/features/toggle-mission/model/useToggleMission";
import { useStartFocusSession } from "@/features/start-focus-session/model/useStartFocusSession";
import { useDeleteMission } from "@/features/delete-mission/model/useDeleteMission";

export function MissionBoard({ onOpenAddMission }: { onOpenAddMission: () => void }) {
  const { data: missions = [] } = useMissions();
  const toggleMission = useToggleMission();
  const startFocusSession = useStartFocusSession();
  const deleteMission = useDeleteMission();

  const completedCount = missions.filter((mission) => mission.isCompleted).length;
  const totalCount = missions.length;
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  function handleToggle(id: string, next: boolean) {
    toggleMission.mutate({ id, isCompleted: next });
  }

  return (
    <div className="flex w-full flex-col gap-4.5">
      <Panel className="w-full">
        <div className="flex items-center justify-between border-b-2 border-line px-5 py-4">
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
              onDelete={() => deleteMission.mutate(mission.id)}
              isDeleting={deleteMission.isPending && deleteMission.variables === mission.id}
            />
          ))}
        </div>

        <div className="border-t-2 border-line px-5 py-5 sm:px-6">
          <button
            type="button"
            onClick={onOpenAddMission}
            className="w-full border-2 border-line-strong px-6 py-4.5 text-[14.5px] font-bold text-ink transition-colors hover:bg-surface-muted"
          >
            + 미션 추가
          </button>
        </div>
      </Panel>

      {totalCount > 0 ? <ProgressBar value={completionRate} className="sm:hidden" /> : null}
    </div>
  );
}
