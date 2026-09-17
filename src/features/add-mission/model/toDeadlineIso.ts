const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * "HH:mm" 형태의 시각 입력을 기준 날짜(now, 기본값 오늘)와 합쳐
 * Postgres timestamptz 컬럼에 맞는 ISO 8601 문자열로 변환한다.
 * now의 날짜 + 입력 시각을 조합한 결과가 now보다 과거면(예: 23:50에 00:30 입력),
 * 다음 날로 롤오버한다.
 */
export function toDeadlineIso(time: string, now: Date = new Date()): string {
  const match = TIME_PATTERN.exec(time);
  if (!match) {
    throw new Error(`잘못된 시간 형식입니다: ${time}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  if (deadline.getTime() < now.getTime()) {
    deadline.setDate(deadline.getDate() + 1);
  }
  return deadline.toISOString();
}
