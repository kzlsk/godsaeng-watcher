import { describe, expect, it } from "vitest";
import { formatMissionDeadline } from "./formatMissionDeadline";

describe("formatMissionDeadline", () => {
  it("deadline이 빈 문자열이면 null을 반환한다", () => {
    expect(formatMissionDeadline("")).toBeNull();
  });

  it("'HH:mm 마감' 형태로 반환한다", () => {
    const deadline = new Date(2026, 8, 17, 9, 0, 0).toISOString();

    expect(formatMissionDeadline(deadline)).toBe("09:00 마감");
  });

  it("날짜가 오늘이 아니어도 날짜 없이 'HH:mm 마감' 형태로 반환한다", () => {
    const deadline = new Date(2026, 8, 18, 9, 0, 0).toISOString();

    expect(formatMissionDeadline(deadline)).toBe("09:00 마감");
  });

  it("분이 한 자리 수여도 0으로 패딩한다", () => {
    const deadline = new Date(2026, 8, 17, 9, 5, 0).toISOString();

    expect(formatMissionDeadline(deadline)).toBe("09:05 마감");
  });
});
