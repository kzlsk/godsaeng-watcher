export function calculateStreak(checkedInDates: string[], today: string): number {
  const dates = new Set(checkedInDates);
  const cursor = new Date(`${today}T00:00:00.000Z`);

  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
