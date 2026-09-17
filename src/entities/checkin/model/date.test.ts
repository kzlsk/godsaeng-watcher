import { describe, expect, it } from "vitest";
import { getDayRange, getTodayDateString } from "./date";

describe("getTodayDateString", () => {
  it("Date를 YYYY-MM-DD(UTC) 문자열로 변환한다", () => {
    expect(getTodayDateString(new Date("2026-09-17T15:30:00.000Z"))).toBe("2026-09-17");
  });
});

describe("getDayRange", () => {
  it("해당 날짜의 UTC 00:00 ~ 다음날 00:00 범위를 반환한다", () => {
    const range = getDayRange("2026-09-17");

    expect(range.start).toBe("2026-09-17T00:00:00.000Z");
    expect(range.end).toBe("2026-09-18T00:00:00.000Z");
  });
});
