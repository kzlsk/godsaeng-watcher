import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/shared/lib/supabase/server";

type QueryResult = { data: unknown; error: { message: string } | null };
type RecordedCall = { name: string; args: unknown[] };

function makeBuilder(result: QueryResult, onCall: (name: string, args: unknown[]) => void) {
  const builder: Record<string, unknown> = {};
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      onCall(name, args);
      return builder;
    };

  builder.select = record("select");
  builder.eq = record("eq");
  builder.gte = record("gte");
  builder.lt = record("lt");
  builder.order = record("order");
  builder.limit = record("limit");
  builder.is = record("is");
  builder.update = record("update");
  builder.insert = record("insert");
  builder.maybeSingle = () => Promise.resolve(result);
  builder.single = () => Promise.resolve(result);
  builder.then = (onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

// from("focus_sessions")가 호출될 때마다 queue에서 순서대로 결과를 소비한다.
function mockSupabaseQueue(queue: QueryResult[]) {
  const calls: RecordedCall[] = [];
  let index = 0;

  const client = {
    from: () => {
      const result = queue[index] ?? { data: null, error: null };
      index += 1;
      return makeBuilder(result, (name, args) => calls.push({ name, args }));
    },
  };

  vi.mocked(createClient).mockResolvedValue(client as never);
  return calls;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("GET /api/focus-sessions", () => {
  it("오늘 세그먼트를 조회해 FocusSession으로 변환해 반환한다", async () => {
    mockSupabaseQueue([
      {
        data: [
          {
            id: "s1",
            mission_id: "m1",
            started_at: "2026-09-17T09:00:00.000Z",
            ended_at: null,
            missions: { title: "코테 2문제", deadline: null, duration_min: 30 },
          },
        ],
        error: null,
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(body.status).toBe("running");
    expect(body.missionTitle).toBe("코테 2문제");
  });
});

describe("POST /api/focus-sessions", () => {
  it("action=start면 새 세그먼트를 insert한다", async () => {
    const calls = mockSupabaseQueue([
      { data: null, error: null }, // closeOpenSession: 열린 세그먼트 없음
      { data: null, error: null }, // insert
      { data: [], error: null }, // fetchTodaySession
    ]);

    const response = await POST(
      new Request("http://localhost/api/focus-sessions", {
        method: "POST",
        body: JSON.stringify({ missionId: "m1", action: "start" }),
      }),
    );

    expect(response.ok).toBe(true);
    const insertCall = calls.find((call) => call.name === "insert");
    expect(insertCall?.args[0]).toMatchObject({ mission_id: "m1" });
  });

  it("action=pause면 열린 세그먼트를 ended_at/duration_min과 함께 닫는다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T09:25:00.000Z"));

    const calls = mockSupabaseQueue([
      { data: { id: "open-1", started_at: "2026-09-17T09:00:00.000Z" }, error: null }, // 열린 세그먼트
      { data: null, error: null }, // update
      { data: [], error: null }, // fetchTodaySession
    ]);

    const response = await POST(
      new Request("http://localhost/api/focus-sessions", {
        method: "POST",
        body: JSON.stringify({ action: "pause" }),
      }),
    );

    expect(response.ok).toBe(true);
    const updateCall = calls.find((call) => call.name === "update");
    expect(updateCall?.args[0]).toMatchObject({
      ended_at: "2026-09-17T09:25:00.000Z",
      duration_min: 25,
    });
  });

  it("action=pause인데 열린 세그먼트가 없으면 update 없이 그대로 반환한다", async () => {
    const calls = mockSupabaseQueue([
      { data: null, error: null }, // 열린 세그먼트 없음
      { data: [], error: null }, // fetchTodaySession
    ]);

    const response = await POST(
      new Request("http://localhost/api/focus-sessions", {
        method: "POST",
        body: JSON.stringify({ action: "pause" }),
      }),
    );

    expect(response.ok).toBe(true);
    expect(calls.some((call) => call.name === "update")).toBe(false);
  });
});
