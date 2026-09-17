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

function mockWeeklyDurations(durations: (number | null)[]) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.gte = chain;
  builder.lt = chain;
  builder.then = (onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve({ data: durations.map((duration_min) => ({ duration_min })), error: null }).then(onFulfilled);

  vi.mocked(createClient).mockResolvedValue({ from: () => builder } as never);
}

describe("GET /api/focus-sessions/weekly", () => {
  it("이번 주 duration_min 합계를 반환한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T12:00:00.000Z"));
    mockWeeklyDurations([30, 45, null, 25]);

    const response = await GET();
    const body = await response.json();

    expect(body.totalMinutes).toBe(100);
    expect(body.weekStart).toBe("2026-09-14T00:00:00.000Z");
  });
});
