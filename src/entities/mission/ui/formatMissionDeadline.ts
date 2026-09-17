function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * ISO 8601 deadline을 "HH:mm 마감" 형태로 포맷한다.
 * deadline이 빈 문자열이면 null을 반환한다(마감 미표시).
 */
export function formatMissionDeadline(deadline: string): string | null {
  if (!deadline) return null;

  const date = new Date(deadline);
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

  return `${time} 마감`;
}
