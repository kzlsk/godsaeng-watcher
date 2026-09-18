import { getAppToday } from "@/shared/lib/date/getAppToday";

export function getTodayDateString(reference: Date = new Date()): string {
  return getAppToday(reference);
}

// 월요일 시작 기준 그 주의 시작 날짜. reference를 생략하면 오늘(새벽 2시 컷오프 기준)이 속한 주를 계산한다.
export function getWeekStartDateString(
  reference: Date = new Date(`${getAppToday()}T00:00:00.000Z`),
): string {
  const day = reference.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate() - diffToMonday),
  );
  return monday.toISOString().slice(0, 10);
}
