import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/shared/lib/supabase/server";

type QueryResult = { data: unknown; error: { message: string } | null };

function makeBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  builder.select = chain;
  builder.order = chain;
  builder.insert = chain;
  builder.single = () => Promise.resolve(result);
  builder.then = (onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

function mockSupabase(result: QueryResult) {
  const client = {
    from: () => makeBuilder(result),
    auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
  };
  vi.mocked(createClient).mockResolvedValue(client as never);
  return client;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("GET /api/missions", () => {
  it("오늘(새벽 2시 컷오프 기준) 완료된 미션은 응답에 포함하고, 그 이전에 완료된 미션은 제외한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T05:00:00.000Z")); // KST 2026-09-18 14:00 → 오늘=09-18

    mockSupabase({
      data: [
        {
          id: "done-today",
          category: "코테",
          title: "오늘 완료",
          deadline: null,
          urgent: false,
          done: true,
          created_at: "2026-09-18T02:00:00.000Z",
          focus_sessions: [],
        },
        {
          id: "done-yesterday",
          category: "코테",
          title: "어제 완료",
          deadline: null,
          urgent: false,
          done: true,
          created_at: "2026-09-17T02:00:00.000Z",
          focus_sessions: [],
        },
      ],
      error: null,
    });

    const response = await GET();
    const body = (await response.json()) as { id: string }[];

    expect(body.map((mission) => mission.id)).toEqual(["done-today"]);
  });

  it("미완료 미션은 계속 노출하며 deadline 기준 overdueDays를 함께 반환한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T05:00:00.000Z")); // 오늘=09-18

    mockSupabase({
      data: [
        {
          id: "overdue",
          category: "코테",
          title: "3일 지연",
          deadline: "2026-09-15T09:00:00.000Z",
          urgent: false,
          done: false,
          created_at: "2026-09-10T02:00:00.000Z",
          focus_sessions: [],
        },
      ],
      error: null,
    });

    const response = await GET();
    const body = (await response.json()) as { id: string; overdueDays: number }[];

    expect(body[0]).toMatchObject({ id: "overdue", overdueDays: 3 });
  });

  it("Supabase 에러가 나면 500과 에러 메시지를 반환한다", async () => {
    mockSupabase({ data: null, error: { message: "boom" } });

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "boom" });
  });
});

describe("POST /api/missions", () => {
  it("topic/todo가 없으면 400을 반환한다", async () => {
    const response = await POST(
      new Request("http://localhost/api/missions", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("정상 입력이면 미션을 생성하고 201을 반환한다", async () => {
    mockSupabase({
      data: {
        id: "new-1",
        category: "코테",
        title: "새 미션",
        deadline: null,
        urgent: false,
        done: false,
        created_at: "2026-09-18T02:00:00.000Z",
        focus_sessions: [],
      },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/missions", {
        method: "POST",
        body: JSON.stringify({ topic: "코테", todo: "새 미션", isImportant: false }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ id: "new-1", topic: "코테", todo: "새 미션" });
  });
});
