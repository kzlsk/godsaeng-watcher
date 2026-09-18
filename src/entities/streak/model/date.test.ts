import { afterEach, describe, expect, it, vi } from "vitest";
import { getTodayDateString, getWeekStartDateString } from "./date";

afterEach(() => {
  vi.useRealTimers();
});

describe("getTodayDateString", () => {
  it("getAppToday()에 위임해 새벽 2시 컷오프를 반영한 날짜를 반환한다", () => {
    // KST 2026-09-18T00:30(컷오프 이전) == UTC 2026-09-17T15:30:00.000Z → 전날로 판정
    expect(getTodayDateString(new Date("2026-09-17T15:30:00.000Z"))).toBe("2026-09-17");
  });

  it("KST 새벽 2시 이후는 당일 날짜를 반환한다", () => {
    // KST 2026-09-18T02:00 == UTC 2026-09-17T17:00:00.000Z
    expect(getTodayDateString(new Date("2026-09-17T17:00:00.000Z"))).toBe("2026-09-18");
  });
});

describe("getWeekStartDateString", () => {
  it("목요일 기준으로 그 주 월요일을 반환한다", () => {
    expect(getWeekStartDateString(new Date("2026-09-17T15:30:00.000Z"))).toBe("2026-09-14");
  });

  it("일요일이면 지난 월요일을 반환한다", () => {
    expect(getWeekStartDateString(new Date("2026-09-20T15:30:00.000Z"))).toBe("2026-09-14");
  });

  it("월요일이면 당일을 반환한다", () => {
    expect(getWeekStartDateString(new Date("2026-09-14T00:00:00.000Z"))).toBe("2026-09-14");
  });

  it("reference를 생략하면 새벽 2시 컷오프가 반영된 오늘이 속한 주의 월요일을 반환한다", () => {
    vi.useFakeTimers();
    // KST 2026-09-14(월) 새벽 1시 == UTC 2026-09-13T16:00:00.000Z → 컷오프 이전이라 전날(일요일)로 판정,
    // 지난주 일요일이 속한 주(지지난주 월요일)를 반환해야 한다.
    vi.setSystemTime(new Date("2026-09-13T16:00:00.000Z"));
    expect(getWeekStartDateString()).toBe("2026-09-07");
  });
});
