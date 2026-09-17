export function getTodayDateString(reference: Date = new Date()): string {
  return reference.toISOString().slice(0, 10);
}

// 월요일 시작 기준 그 주의 시작 날짜
export function getWeekStartDateString(reference: Date = new Date()): string {
  const day = reference.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate() - diffToMonday),
  );
  return monday.toISOString().slice(0, 10);
}
