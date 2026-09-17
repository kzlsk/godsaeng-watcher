function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * ISO 8601 deadline을 "HH:mm 마감" 형태로 포맷한다.
 * 오늘이 아니면 "M/D HH:mm 마감"처럼 날짜를 함께 표시한다.
 * deadline이 빈 문자열이면 null을 반환한다(마감 미표시).
 */
export function formatMissionDeadline(deadline: string, now: Date = new Date()): string | null {
  if (!deadline) return null;

  const date = new Date(deadline);
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) return `${time} 마감`;

  return `${date.getMonth() + 1}/${date.getDate()} ${time} 마감`;
}
