import { getAppToday } from "@/shared/lib/date/getAppToday";

// deadline이 오늘(today, getAppToday 형식) 이전 날짜에 속하면 그 차이(일수)를 반환한다.
// 아직 지나지 않았거나 deadline이 없으면 0.
export function calculateOverdueDays(deadline: string, today: string): number {
  if (!deadline) return 0;

  const deadlineDay = getAppToday(new Date(deadline));
  if (deadlineDay >= today) return 0;

  const diffMs = Date.parse(`${today}T00:00:00.000Z`) - Date.parse(`${deadlineDay}T00:00:00.000Z`);
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}
