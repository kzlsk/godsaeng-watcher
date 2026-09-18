import { describe, expect, it } from "vitest";
import { minutesForHour, selectableHours } from "@/features/add-mission/ui/deadlineTimeRange";

describe("minutesForHour", () => {
  it("현재 시보다 이후인 hour는 10분 단위 전체를 허용한다", () => {
    const now = new Date(2024, 0, 15, 16, 23);
    expect(minutesForHour(17, now)).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it("현재 시보다 이전인 hour는 하나도 허용하지 않는다 (예: 지금 16시인데 13시)", () => {
    const now = new Date(2024, 0, 15, 16, 23);
    expect(minutesForHour(13, now)).toEqual([]);
  });

  it("현재와 같은 hour면 이미 지난 분만 제외한다", () => {
    const now = new Date(2024, 0, 15, 16, 23);
    expect(minutesForHour(16, now)).toEqual([30, 40, 50]);
  });

  it("같은 hour에서 남는 분이 없으면(예: 16:55) 자정을 넘기지 않도록 마지막 마크(50분)만 남긴다", () => {
    const now = new Date(2024, 0, 15, 16, 55);
    expect(minutesForHour(16, now)).toEqual([50]);
  });
});

describe("selectableHours", () => {
  it("현재 시각 이후 ~ 23시까지만 목록에 남는다", () => {
    const now = new Date(2024, 0, 15, 21, 10);
    expect(selectableHours(now)).toEqual([21, 22, 23]);
  });

  it("자정을 넘는 24시는 만들어지지 않는다 (23시가 마지막)", () => {
    const now = new Date(2024, 0, 15, 23, 10);
    expect(selectableHours(now)).toEqual([23]);
  });
});
