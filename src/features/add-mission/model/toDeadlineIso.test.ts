import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toDeadlineIso } from "@/features/add-mission/model/toDeadlineIso";

describe("toDeadlineIso", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 9, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("오늘 날짜 기준으로 HH:mm을 ISO 8601 timestamptz 문자열로 변환한다", () => {
    const now = new Date(2024, 0, 15, 9, 0, 0);
    const iso = toDeadlineIso("13:00", now);
    const result = new Date(iso);

    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(0);
  });

  it("입력 시각이 now보다 과거면 다음 날로 롤오버한다 (23:50에 00:30 입력)", () => {
    const now = new Date(2024, 0, 15, 23, 50, 0);
    const iso = toDeadlineIso("00:30", now);
    const result = new Date(iso);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(16);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(30);
  });

  it("now를 생략하면 현재 날짜를 기준으로 변환한다", () => {
    const before = new Date();
    const iso = toDeadlineIso("13:00");
    const result = new Date(iso);

    expect(result.getFullYear()).toBe(before.getFullYear());
    expect(result.getMonth()).toBe(before.getMonth());
    expect(result.getDate()).toBe(before.getDate());
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(0);
  });

  it("잘못된 형식이면 에러를 던진다", () => {
    expect(() => toDeadlineIso("1300")).toThrow();
    expect(() => toDeadlineIso("25:00")).toThrow();
    expect(() => toDeadlineIso("")).toThrow();
  });
});
