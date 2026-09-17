import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/shared/lib/supabase/server";

type QueryResult = { data: unknown; error: { message: string } | null };

function makeBuilder(result: QueryResult, spies: { upsert?: ReturnType<typeof vi.fn> } = {}) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  builder.select = chain;
  builder.eq = chain;
  builder.gte = chain;
  builder.lt = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.upsert = spies.upsert ?? chain;
  builder.maybeSingle = () => Promise.resolve(result);
  builder.single = () => Promise.resolve(result);
  builder.then = (onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

function mockSupabase(tableResults: Record<string, QueryResult>, upsertSpy?: ReturnType<typeof vi.fn>) {
  const client = {
    from: (table: string) => makeBuilder(tableResults[table], table === "checkins" ? { upsert: upsertSpy } : {}),
  };
  vi.mocked(createClient).mockResolvedValue(client as never);
  return client;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/checkins", () => {
  it("체크인 데이터와 오늘의 집중 시간 합계를 함께 반환한다", async () => {
    mockSupabase({
      checkins: { data: { date: "2026-09-17", applications: 2, problems: 1 }, error: null },
      focus_sessions: { data: [{ duration_min: 25 }, { duration_min: 15 }], error: null },
    });

    const response = await GET(new Request("http://localhost/api/checkins?date=today"));
    const body = await response.json();

    expect(body).toEqual({
      totalFocusMinutes: 40,
      focusAheadMinutes: 0,
      delayMinutesToday: 0,
      delayMinutesWeek: 0,
      date: "2026-09-17",
      applications: 2,
      problems: 1,
    });
  });

  it("오늘 체크인 행이 없으면 0으로 채워 반환한다", async () => {
    mockSupabase({
      checkins: { data: null, error: null },
      focus_sessions: { data: [], error: null },
    });

    const response = await GET(new Request("http://localhost/api/checkins"));
    const body = await response.json();

    expect(body.applications).toBe(0);
    expect(body.problems).toBe(0);
    expect(body.totalFocusMinutes).toBe(0);
  });

  it("Supabase 에러가 나면 500과 에러 메시지를 반환한다", async () => {
    mockSupabase({
      checkins: { data: null, error: { message: "boom" } },
      focus_sessions: { data: [], error: null },
    });

    const response = await GET(new Request("http://localhost/api/checkins"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "boom" });
  });
});

describe("POST /api/checkins", () => {
  it("applications/problems를 upsert payload에 그대로 담아 저장한다", async () => {
    const upsertResult = { data: { date: "2026-09-17", applications: 5, problems: 3 }, error: null };
    const upsertSpy = vi.fn(() => makeBuilder(upsertResult));
    mockSupabase({}, upsertSpy);

    const response = await POST(
      new Request("http://localhost/api/checkins", {
        method: "POST",
        body: JSON.stringify({ applications: 5, problems: 3 }),
      }),
    );
    const body = await response.json();

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ applications: 5, problems: 3 }),
      { onConflict: "user_id,date" },
    );
    expect(body).toEqual({ date: "2026-09-17", applications: 5, problems: 3 });
  });

  it("기존 훅이 보내는 {missionId, isCompleted} 형태는 applications/problems를 건드리지 않는다", async () => {
    const upsertResult = { data: { date: "2026-09-17", applications: 0, problems: 0 }, error: null };
    const upsertSpy = vi.fn(() => makeBuilder(upsertResult));
    mockSupabase({}, upsertSpy);

    const response = await POST(
      new Request("http://localhost/api/checkins", {
        method: "POST",
        body: JSON.stringify({ missionId: "1", isCompleted: true }),
      }),
    );

    expect(response.ok).toBe(true);
    const calls = upsertSpy.mock.calls as unknown as Record<string, unknown>[][];
    const payload = calls[0]?.[0];
    expect(payload).not.toHaveProperty("applications");
    expect(payload).not.toHaveProperty("problems");
  });
});
