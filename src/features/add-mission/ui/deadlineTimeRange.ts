const MINUTE_STEP = 10;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);

/**
 * 주어진 시(hour) 안에서 고를 수 있는 분 목록을 반환한다.
 * - now보다 이후 시각인 hour는 전체 10분 단위(0~50)를 그대로 허용
 * - now보다 이전 시각인 hour는 아예 고를 수 없음(빈 배열)
 * - now와 같은 hour는 이미 지난 분(예: 지금 16:23인데 16:10, 16:20)만 제외
 *   (남는 게 하나도 없으면 자정을 넘기지 않기 위해 그 hour의 마지막 마크(50분)만 남김)
 */
export function minutesForHour(hour: number, now: Date): number[] {
  if (hour > now.getHours()) return MINUTES;
  if (hour < now.getHours()) return [];
  const upcoming = MINUTES.filter((minute) => minute >= now.getMinutes());
  return upcoming.length > 0 ? upcoming : [MINUTES[MINUTES.length - 1]];
}

/**
 * "지금 이후 ~ 오늘 자정 전까지" 조건으로 고를 수 있는 시(hour) 목록.
 * 이미 지난 시각(now보다 이전인 hour)은 목록에서 완전히 제외한다.
 */
export function selectableHours(now: Date): number[] {
  return HOURS.filter((hour) => minutesForHour(hour, now).length > 0);
}
