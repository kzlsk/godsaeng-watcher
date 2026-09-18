import type { FocusSession, FocusSessionStatus } from "./types";

export interface FocusSessionRow {
  id: string;
  mission_id: string | null;
  started_at: string;
  ended_at: string | null;
  missions?: { title: string | null; deadline: string | null; duration_min: number | null } | null;
}

export function formatDeadlineLabel(deadline: string, now: Date): string | null {
  const diffMs = new Date(deadline).getTime() - now.getTime();
  if (diffMs <= 0) return "마감";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// rows는 started_at 내림차순으로 정렬되어 있어야 하고, 오늘(자정~자정) 범위의
// 세그먼트여야 한다 (elapsedSeconds가 "이 미션의 오늘 누적 집중시간"이 되도록 —
// 미션은 하루 단위 개념이라 여러 날에 걸친 누적은 보여주지 않는다).
export function toFocusSession(rows: FocusSessionRow[], now: Date = new Date()): FocusSession {
  if (rows.length === 0) {
    return {
      id: null,
      missionId: null,
      missionTitle: null,
      targetMinutes: 0,
      elapsedSeconds: 0,
      status: "idle",
      deadlineLabel: null,
    };
  }

  const latest = rows[0];
  const activeMissionId = latest.mission_id;
  const relevant = rows.filter((row) => row.mission_id === activeMissionId);

  const elapsedSeconds = relevant.reduce((sum, row) => {
    const end = row.ended_at ? new Date(row.ended_at) : now;
    return sum + Math.max(0, Math.round((end.getTime() - new Date(row.started_at).getTime()) / 1000));
  }, 0);

  // "일시정지"는 DB에 반영되지 않는 프론트 전용 상태라, 서버 관점에서는 열린
  // 세그먼트가 없으면(최신 행이 닫혀 있으면) 항상 idle이다.
  const status: FocusSessionStatus = latest.ended_at ? "idle" : "running";
  const mission = latest.missions;

  return {
    id: latest.id,
    missionId: activeMissionId,
    missionTitle: mission?.title ?? null,
    targetMinutes: mission?.duration_min ?? 0,
    elapsedSeconds,
    status,
    deadlineLabel: mission?.deadline ? formatDeadlineLabel(mission.deadline, now) : null,
  };
}
