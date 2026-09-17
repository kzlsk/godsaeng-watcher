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

// rows는 started_at 내림차순으로 정렬되어 있어야 한다 (가장 최근 세그먼트가 rows[0]).
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

  const status: FocusSessionStatus = latest.ended_at ? "paused" : "running";
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
