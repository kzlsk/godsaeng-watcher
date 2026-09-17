export function getTodayDateString(reference: Date = new Date()): string {
  return reference.toISOString().slice(0, 10);
}

export function getDayRange(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}
