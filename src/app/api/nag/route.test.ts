import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/shared/lib/ai/callOpenAI", () => ({
  generateNagMessage: vi.fn(),
}));

import { createClient } from "@/shared/lib/supabase/server";
import { generateNagMessage } from "@/shared/lib/ai/callOpenAI";

type QueryResult = { data: unknown; error: { message: string } | null };

function makeBuilder(result: QueryResult, insertSpy?: ReturnType<typeof vi.fn>) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  builder.select = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.gte = chain;
  builder.lt = chain;
  builder.eq = chain;
  builder.maybeSingle = () => Promise.resolve(result);
  builder.single = () => Promise.resolve(result);
  builder.insert = insertSpy ?? (() => Promise.resolve({ data: null, error: null }));
  builder.then = (onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

interface MockOptions {
  missions?: QueryResult;
  focusSessions?: QueryResult[]; // [today, week] 순서
  checkins?: QueryResult;
  nagLogsSelect?: QueryResult;
  insertSpy?: ReturnType<typeof vi.fn>;
}

function mockSupabase(opts: MockOptions) {
  let focusIndex = 0;

  const client = {
    from: (table: string) => {
      if (table === "missions") return makeBuilder(opts.missions ?? { data: [], error: null });
      if (table === "focus_sessions") {
        const result = opts.focusSessions?.[focusIndex] ?? { data: [], error: null };
        focusIndex += 1;
        return makeBuilder(result);
      }
      if (table === "checkins") return makeBuilder(opts.checkins ?? { data: [], error: null });
      if (table === "nag_logs") return makeBuilder(opts.nagLogsSelect ?? { data: null, error: null }, opts.insertSpy);
      return makeBuilder({ data: null, error: null });
    },
  };

  vi.mocked(createClient).mockResolvedValue(client as never);
  return client;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("GET /api/nag", () => {
  it("오늘 미션이 1개 이상이고 전부 완료면 success 모드로 칭찬 메시지를 생성한다", async () => {
    mockSupabase({
      missions: {
        data: [
          { title: "포트폴리오 제출", deadline: null, done: true, created_at: "2026-09-17T01:00:00.000Z" },
          { title: "회고 쓰기", deadline: null, done: true, created_at: "2026-09-17T02:00:00.000Z" },
        ],
        error: null,
      },
    });
    vi.mocked(generateNagMessage).mockResolvedValue("오늘처럼만 하면 실력이 되는 거야.");

    const response = await GET();
    const body = await response.json();

    expect(generateNagMessage).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "success", completedCount: 2, totalCount: 2 }),
    );
    expect(body.mode).toBe("success");
    expect(body.quote).toBe("오늘처럼만 하면 실력이 되는 거야.");
  });

  it("완료율이 100% 미만이면 fail 모드(쓴소리)를 유지한다", async () => {
    mockSupabase({
      missions: {
        data: [
          { title: "포트폴리오 제출", deadline: null, done: true, created_at: "2026-09-17T01:00:00.000Z" },
          { title: "코테 2문제", deadline: null, done: false, created_at: "2026-09-17T02:00:00.000Z" },
        ],
        error: null,
      },
    });
    vi.mocked(generateNagMessage).mockResolvedValue("오늘도 미뤘네.");

    const response = await GET();
    const body = await response.json();

    expect(generateNagMessage).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "fail", pendingMissionTitles: ["코테 2문제"] }),
    );
    expect(body.mode).toBe("fail");
  });

  it("오늘 미션이 하나도 없으면 success가 아니라 fail을 유지한다", async () => {
    mockSupabase({ missions: { data: [], error: null } });
    vi.mocked(generateNagMessage).mockResolvedValue("계획을 세운 게 아니라 희망을 적어둔 거였네.");

    const response = await GET();
    const body = await response.json();

    expect(generateNagMessage).toHaveBeenCalledWith(expect.objectContaining({ mode: "fail", totalCount: 0 }));
    expect(body.mode).toBe("fail");
  });

  it("마감을 넘긴 미완료 미션의 건수/지연 분을 정확히 집계해 프롬프트 입력으로 넘긴다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T10:00:00.000Z"));

    mockSupabase({
      missions: {
        data: [
          // 2시간(120분) 지난 마감, 미완료 → 마감 초과
          { title: "코테 2문제", deadline: "2026-09-18T08:00:00.000Z", done: false, created_at: "2026-09-18T01:00:00.000Z" },
          // 아직 마감 전 → 초과 아님
          { title: "회고 쓰기", deadline: "2026-09-18T22:00:00.000Z", done: false, created_at: "2026-09-18T01:00:00.000Z" },
        ],
        error: null,
      },
      focusSessions: [
        { data: [{ duration_min: 30 }, { duration_min: 15 }], error: null }, // 오늘 45분
        { data: [{ duration_min: 30 }, { duration_min: 15 }, { duration_min: 60 }], error: null }, // 이번 주 105분
      ],
    });
    vi.mocked(generateNagMessage).mockResolvedValue("쓴소리");

    await GET();

    expect(generateNagMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        deadlineOverCount: 1,
        delayMinutesToday: 120,
        focusMinutesToday: 45,
        focusMinutesWeek: 105,
      }),
    );
  });

  it("직전 로그와 mode가 같으면 재생성 없이 기존 문구를 그대로 반환한다", async () => {
    mockSupabase({
      missions: {
        data: [{ title: "코테 2문제", deadline: null, done: false, created_at: "2026-09-17T01:00:00.000Z" }],
        error: null,
      },
      nagLogsSelect: {
        data: { content: "저장된 이전 문구", context: { mode: "fail", personaId: "realist" }, regenerate_count: 0 },
        error: null,
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(generateNagMessage).not.toHaveBeenCalled();
    expect(body.quote).toBe("저장된 이전 문구");
    expect(body.activePersonaId).toBe("realist");
  });

  it("직전 로그와 mode가 다르면(완료율이 100%가 됨) 재생성한다", async () => {
    mockSupabase({
      missions: {
        data: [{ title: "코테 2문제", deadline: null, done: true, created_at: "2026-09-17T01:00:00.000Z" }],
        error: null,
      },
      nagLogsSelect: {
        data: { content: "이전 쓴소리", context: { mode: "fail", personaId: "furious-boss" }, regenerate_count: 0 },
        error: null,
      },
    });
    vi.mocked(generateNagMessage).mockResolvedValue("오늘은 인정. 내일도 이렇게 와.");

    const response = await GET();
    const body = await response.json();

    expect(generateNagMessage).toHaveBeenCalledWith(expect.objectContaining({ mode: "success", personaId: "furious-boss" }));
    expect(body.quote).toBe("오늘은 인정. 내일도 이렇게 와.");
  });

  it("missions 조회가 실패하면 500과 에러 메시지를 반환하고 AI 하네스를 호출하지 않는다", async () => {
    mockSupabase({ missions: { data: null, error: { message: "boom" } } });

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "boom" });
    expect(generateNagMessage).not.toHaveBeenCalled();
  });
});

describe("POST /api/nag", () => {
  it("personaId를 지정하면 해당 페르소나로 재생성하고 regenerate_count를 올린다", async () => {
    const insertSpy = vi.fn(() => Promise.resolve({ data: null, error: null }));
    mockSupabase({
      missions: {
        data: [{ title: "코테 2문제", deadline: null, done: false, created_at: "2026-09-17T01:00:00.000Z" }],
        error: null,
      },
      nagLogsSelect: {
        data: { content: "이전 문구", context: { mode: "fail", personaId: "realist" }, regenerate_count: 2 },
        error: null,
      },
      insertSpy,
    });
    vi.mocked(generateNagMessage).mockResolvedValue("나 진짜 서운해...");

    const response = await POST(
      new Request("http://localhost/api/nag", {
        method: "POST",
        body: JSON.stringify({ personaId: "clingy-friend" }),
      }),
    );
    const body = await response.json();

    expect(generateNagMessage).toHaveBeenCalledWith(expect.objectContaining({ personaId: "clingy-friend" }));
    expect(body.activePersonaId).toBe("clingy-friend");
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ regenerate_count: 3, context: { mode: "fail", personaId: "clingy-friend" } }),
    );
  });

  it("mode가 바뀌지 않아도 '한 번 더 때려줘'를 누를 때마다 항상 새로 생성하고 regenerate_count가 순차 증가한다", async () => {
    // GET의 캐시 재사용(mode 동일 시 재생성 생략) 로직이 POST에는 적용되지 않아야 한다는 걸
    // 고정하는 회귀 테스트. nag_logs의 저장 상태를 흉내내서 두 번째/세 번째 호출이 직전
    // insert 결과를 이어받는지도 함께 확인한다.
    let storedLog: { content: string; context: { mode: string; personaId: string }; regenerate_count: number } = {
      content: "이전 문구",
      context: { mode: "fail", personaId: "realist" },
      regenerate_count: 0,
    };
    const insertSpy = vi.fn((payload: { content: string; context: unknown; regenerate_count: number }) => {
      storedLog = payload as typeof storedLog;
      return Promise.resolve({ data: null, error: null });
    });

    const client = {
      from: (table: string) => {
        if (table === "missions") {
          return makeBuilder({
            data: [{ title: "코테 2문제", deadline: null, done: false, created_at: "2026-09-17T01:00:00.000Z" }],
            error: null,
          });
        }
        if (table === "checkins") return makeBuilder({ data: [], error: null });
        if (table === "focus_sessions") return makeBuilder({ data: [], error: null });
        if (table === "nag_logs") return makeBuilder({ data: storedLog, error: null }, insertSpy);
        return makeBuilder({ data: null, error: null });
      },
    };
    vi.mocked(createClient).mockResolvedValue(client as never);
    vi.mocked(generateNagMessage)
      .mockResolvedValueOnce("문구 A")
      .mockResolvedValueOnce("문구 B")
      .mockResolvedValueOnce("문구 C");

    const postOnce = () =>
      POST(new Request("http://localhost/api/nag", { method: "POST", body: JSON.stringify({}) })).then((res) =>
        res.json(),
      );

    const first = await postOnce();
    const second = await postOnce();
    const third = await postOnce();

    expect([first.quote, second.quote, third.quote]).toEqual(["문구 A", "문구 B", "문구 C"]);
    expect(generateNagMessage).toHaveBeenCalledTimes(3);
    expect(insertSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ regenerate_count: 1 }));
    expect(insertSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ regenerate_count: 2 }));
    expect(insertSpy).toHaveBeenNthCalledWith(3, expect.objectContaining({ regenerate_count: 3 }));
  });
});
