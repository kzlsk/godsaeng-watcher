import { describe, expect, it } from "vitest";
import { calculateStreak } from "./calculateStreak";

describe("calculateStreak", () => {
  it("오늘부터 연속된 체크인 일수를 센다", () => {
    const dates = ["2026-09-17", "2026-09-16", "2026-09-15"];
    expect(calculateStreak(dates, "2026-09-17")).toBe(3);
  });

  it("오늘 체크인이 없으면 0이다", () => {
    const dates = ["2026-09-16", "2026-09-15"];
    expect(calculateStreak(dates, "2026-09-17")).toBe(0);
  });

  it("중간에 끊긴 날짜 이후는 세지 않는다", () => {
    const dates = ["2026-09-17", "2026-09-16", "2026-09-14"];
    expect(calculateStreak(dates, "2026-09-17")).toBe(2);
  });

  it("체크인이 하나도 없으면 0이다", () => {
    expect(calculateStreak([], "2026-09-17")).toBe(0);
  });

  it("같은 날짜가 중복돼도 한 번만 센다", () => {
    const dates = ["2026-09-17", "2026-09-17", "2026-09-16"];
    expect(calculateStreak(dates, "2026-09-17")).toBe(2);
  });
});
