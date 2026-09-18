import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppDayRange, getAppToday } from "./getAppToday";

afterEach(() => {
  vi.useRealTimers();
});

describe("getAppToday", () => {
  it("KST 새벽 1시는 전날 날짜로 판정한다", () => {
    // KST 2026-09-18T01:00:00 == UTC 2026-09-17T16:00:00.000Z
    expect(getAppToday(new Date("2026-09-17T16:00:00.000Z"))).toBe("2026-09-17");
  });

  it("KST 새벽 2시는 당일 날짜로 판정한다", () => {
    // KST 2026-09-18T02:00:00 == UTC 2026-09-17T17:00:00.000Z
    expect(getAppToday(new Date("2026-09-17T17:00:00.000Z"))).toBe("2026-09-18");
  });

  it("KST 새벽 2시 직전(01:59:59.999)은 전날 날짜로 판정한다", () => {
    expect(getAppToday(new Date("2026-09-17T16:59:59.999Z"))).toBe("2026-09-17");
  });

  it("일반 낮 시간대는 평소처럼 그날 날짜를 반환한다", () => {
    // KST 2026-09-18T23:59:00 == UTC 2026-09-18T14:59:00.000Z
    expect(getAppToday(new Date("2026-09-18T14:59:00.000Z"))).toBe("2026-09-18");
  });

  it("인자를 생략하면 현재 시각 기준으로 계산한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T16:00:00.000Z")); // KST 새벽 1시
    expect(getAppToday()).toBe("2026-09-17");
  });
});

describe("getAppDayRange", () => {
  it("앱 하루 문자열을 KST 새벽 2시~다음날 새벽 2시의 UTC 범위로 변환한다", () => {
    const range = getAppDayRange("2026-09-17");

    expect(range.start).toBe("2026-09-16T17:00:00.000Z");
    expect(range.end).toBe("2026-09-17T17:00:00.000Z");
  });

  it("인자를 생략하면 getAppToday()가 반환하는 오늘 범위를 사용한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T17:30:00.000Z")); // KST 2026-09-18 02:30 → 오늘=09-18
    const range = getAppDayRange();

    expect(range.start).toBe("2026-09-17T17:00:00.000Z");
    expect(range.end).toBe("2026-09-18T17:00:00.000Z");
  });
});
