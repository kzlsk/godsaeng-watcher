import type { Mission } from "@/entities/mission/model/types";

export interface MissionRow {
  id: string;
  category: string | null;
  title: string;
  deadline: string | null;
  urgent: boolean | null;
  done: boolean | null;
  focus_sessions?: { duration_min: number | null }[] | null;
}

export function toMission(row: MissionRow): Mission {
  const actualFocusMinutes = (row.focus_sessions ?? []).reduce(
    (sum, session) => sum + (session.duration_min ?? 0),
    0,
  );

  return {
    id: row.id,
    topic: row.category ?? "",
    todo: row.title,
    deadline: row.deadline ?? "",
    isImportant: row.urgent ?? false,
    isCompleted: row.done ?? false,
    actualFocusMinutes,
  };
}
