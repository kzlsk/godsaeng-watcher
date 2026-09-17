import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/shared/lib/supabase/server";

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

type CheckinFixture = { date: string; applications: number | null; problems: number | null };

function mockSupabase(checkins: CheckinFixture[], completedMissionCreatedAts: string[]) {
  const client = {
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      builder.select = chain;
      builder.eq = chain;
      builder.order = chain;
      builder.limit = chain;
      builder.then = (onFulfilled: (value: unknown) => unknown) => {
        const data =
          table === "checkins" ? checkins : completedMissionCreatedAts.map((created_at) => ({ created_at }));
        return Promise.resolve({ data, error: null }).then(onFulfilled);
      };
      return builder;
    },
  };

  vi.mocked(createClient).mockResolvedValue(client as never);
}

describe("GET /api/streak", () => {
  it("demo-store 없이 실제 checkins/missions 데이터로 StreakSummary를 계산해 반환한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T12:00:00.000Z")); // 목요일

    mockSupabase(
      [
        { date: "2026-09-17", applications: 2, problems: 0 },
        { date: "2026-09-16", applications: 0, problems: 1 },
      ],
      [],
    );

    const response = await GET();
    const body = await response.json();

    expect(body.currentStreak).toBe(2);
    expect(body.last7Days).toHaveLength(7);
    expect(body.last7Days[6]).toBe(true); // 오늘
    expect(body.last7Days[5]).toBe(true); // 어제
    expect(typeof body.weeklyScore).toBe("number");
    expect(typeof body.weeklyScoreDelta).toBe("number");
  });

  it("지원/문제 기록이 없어도 미션 완료만으로 스트릭이 반영된다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T12:00:00.000Z"));

    mockSupabase([], ["2026-09-17T09:00:00.000Z", "2026-09-16T08:00:00.000Z"]);

    const response = await GET();
    const body = await response.json();

    expect(body.currentStreak).toBe(2);
  });

  it("Supabase 에러가 나면 500과 에러 메시지를 반환한다", async () => {
    const client = {
      from: () => {
        const builder: Record<string, unknown> = {};
        const chain = () => builder;
        builder.select = chain;
        builder.eq = chain;
        builder.order = chain;
        builder.limit = chain;
        builder.then = (onFulfilled: (value: unknown) => unknown) =>
          Promise.resolve({ data: null, error: { message: "boom" } }).then(onFulfilled);
        return builder;
      },
    };
    vi.mocked(createClient).mockResolvedValue(client as never);

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "boom" });
  });
});
