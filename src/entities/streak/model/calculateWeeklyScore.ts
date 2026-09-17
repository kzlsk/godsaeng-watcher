// weekStart(월요일)부터 7일간 체크인된 날의 비율을 0~100 점수로 환산한다.
// 스키마에 "주간 점수"에 대응하는 별도 컬럼이 없어, 체크인 일수 기반으로 정의한 파생 지표다.
export function calculateWeeklyScore(checkedInDates: string[], weekStart: string): number {
  const dates = new Set(checkedInDates);
  const cursor = new Date(`${weekStart}T00:00:00.000Z`);

  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    if (dates.has(cursor.toISOString().slice(0, 10))) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return Math.round((count / 7) * 100);
}
