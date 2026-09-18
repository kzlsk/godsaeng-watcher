import type { Mission } from "@/entities/mission/model/types";
import { calculateOverdueDays } from "@/entities/mission/model/calculateOverdueDays";
import { getAppToday } from "@/shared/lib/date/getAppToday";

export interface MissionRow {
  id: string;
  category: string | null;
  title: string;
  deadline: string | null;
  urgent: boolean | null;
  done: boolean | null;
  created_at: string;
  focus_sessions?: { duration_min: number | null; started_at: string }[] | null;
}

// today(getAppToday 형식, 새벽 2시 컷오프 기준)를 생략하면 현재 시각 기준 오늘을 사용한다.
export function toMission(
  row: MissionRow,
  today: string = getAppToday(),
): Mission {
  // 미션 목록의 "· N분"과 집중 타이머 패널이 같은 기준(오늘)을 보여주도록,
  // 전체 기간이 아니라 오늘 시작된 세그먼트만 합산한다.
  const actualFocusMinutes = (row.focus_sessions ?? [])
    .filter((session) => getAppToday(new Date(session.started_at)) === today)
    .reduce((sum, session) => sum + (session.duration_min ?? 0), 0);

  const deadline = row.deadline ?? "";
  const isCompleted = row.done ?? false;

  return {
    id: row.id,
    topic: row.category ?? "",
    todo: row.title,
    deadline,
    isImportant: row.urgent ?? false,
    isCompleted,
    actualFocusMinutes,
    overdueDays: isCompleted ? 0 : calculateOverdueDays(deadline, today),
  };
}
