// 월요일 시작 기준 이번 주 범위
export function getWeekRange(reference: Date = new Date()): { start: string; end: string } {
  const day = reference.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate() - diffToMonday),
  );
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}
