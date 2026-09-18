import { describe, expect, it } from "vitest";
import { calculateStreak, isTodayPending } from "./calculateStreak";

describe("calculateStreak", () => {
  it("오늘부터 연속된 체크인 일수를 센다", () => {
    const dates = ["2026-09-17", "2026-09-16", "2026-09-15"];
    expect(calculateStreak(dates, "2026-09-17")).toBe(3);
  });

  it("오늘 체크인이 없어도 어제까지 이어진 연속일수를 그대로 반환한다(0으로 끊기지 않음)", () => {
    const dates = ["2026-09-16", "2026-09-15"];
    expect(calculateStreak(dates, "2026-09-17")).toBe(2);
  });

  it("어제도 체크인이 없으면(스트릭이 실제로 끊긴 경우) 0이다", () => {
    const dates = ["2026-09-10"];
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

describe("isTodayPending", () => {
  it("오늘 날짜가 체크인 목록에 없으면 true다", () => {
    expect(isTodayPending(["2026-09-16"], "2026-09-17")).toBe(true);
  });

  it("오늘 날짜가 체크인 목록에 있으면 false다", () => {
    expect(isTodayPending(["2026-09-17", "2026-09-16"], "2026-09-17")).toBe(false);
  });
});
