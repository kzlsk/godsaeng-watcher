// "어제까지의 확정된 연속일수" 기준으로 스트릭을 센다. 오늘 체크인이 아직 없어도, 오늘
// 하루가 끝나지 않았을 뿐 어제까지 이어온 기록은 끊긴 게 아니므로 0으로 보여주지 않는다.
// 오늘 이미 체크인했으면 오늘부터(=어제까지 값 + 1) 센다.
export function calculateStreak(checkedInDates: string[], today: string): number {
  const dates = new Set(checkedInDates);
  const cursor = new Date(`${today}T00:00:00.000Z`);

  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

// 오늘이 아직 체크인되지 않았는지 여부. currentStreak가 "어제까지의 확정값"일 때,
// "오늘 완료 시 N일이 됩니다" 안내 문구를 보여줄지 판단하는 데 쓴다.
export function isTodayPending(checkedInDates: string[], today: string): boolean {
  return !checkedInDates.includes(today);
}
