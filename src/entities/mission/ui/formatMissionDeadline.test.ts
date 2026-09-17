import { describe, expect, it } from "vitest";
import { formatMissionDeadline } from "./formatMissionDeadline";

describe("formatMissionDeadline", () => {
  it("deadline이 빈 문자열이면 null을 반환한다", () => {
    expect(formatMissionDeadline("")).toBeNull();
  });

  it("오늘 마감이면 'HH:mm 마감' 형태로 반환한다", () => {
    const now = new Date(2026, 8, 17, 8, 0, 0);
    const deadline = new Date(2026, 8, 17, 9, 0, 0).toISOString();

    expect(formatMissionDeadline(deadline, now)).toBe("09:00 마감");
  });

  it("오늘이 아닌 마감이면 'M/D HH:mm 마감' 형태로 반환한다", () => {
    const now = new Date(2026, 8, 17, 8, 0, 0);
    const deadline = new Date(2026, 8, 18, 9, 0, 0).toISOString();

    expect(formatMissionDeadline(deadline, now)).toBe("9/18 09:00 마감");
  });

  it("분이 한 자리 수여도 0으로 패딩한다", () => {
    const now = new Date(2026, 8, 17, 8, 0, 0);
    const deadline = new Date(2026, 8, 17, 9, 5, 0).toISOString();

    expect(formatMissionDeadline(deadline, now)).toBe("09:05 마감");
  });
});
