// 오늘을 마지막(index 6)으로 하는 최근 7일 체크인 여부 배열
export function buildLast7Days(checkedInDates: string[], today: string): boolean[] {
  const dates = new Set(checkedInDates);
  const cursor = new Date(`${today}T00:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() - 6);

  const days: boolean[] = [];
  for (let i = 0; i < 7; i += 1) {
    days.push(dates.has(cursor.toISOString().slice(0, 10)));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
