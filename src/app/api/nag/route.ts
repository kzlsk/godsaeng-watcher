import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { generateNagMessage } from "@/shared/lib/ai/callOpenAI";
import type { NagPromptContext } from "@/shared/lib/ai/buildNagPrompt";
import { NAG_PERSONAS, type NagPersonaId } from "@/shared/config/personas";
import type { NagMessage } from "@/entities/nag/model/types";
import { getWeekRange } from "@/entities/focus-session/model/dateRange";
import { getAppDayRange, getAppToday } from "@/shared/lib/date/getAppToday";
import { getTodayDateString, getWeekStartDateString } from "@/entities/streak/model/date";
import { calculateStreak } from "@/entities/streak/model/calculateStreak";
import { calculateWeeklyScore } from "@/entities/streak/model/calculateWeeklyScore";
import { resolveCheckedInDates, type CheckinDateRow } from "@/entities/streak/model/resolveCheckedInDates";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const MISSION_SELECT = "title, deadline, done, created_at";

interface MissionForNag {
  title: string;
  deadline: string | null;
  done: boolean | null;
  created_at: string;
}

interface NagAggregate {
  mode: "fail" | "success";
  completedCount: number;
  totalCount: number;
  deadlineOverCount: number;
  delayMinutesToday: number;
  pendingMissionTitles: string[];
  focusMinutesToday: number;
  focusMinutesWeek: number;
  currentStreak: number;
  weeklyScore: number;
}

interface StoredNagContext {
  mode?: string;
  personaId?: string;
}

interface NagLogRow {
  content: string;
  context: StoredNagContext | null;
  regenerate_count: number | null;
}

function isNagPersonaId(value: unknown): value is NagPersonaId {
  return typeof value === "string" && NAG_PERSONAS.some((persona) => persona.id === value);
}

function isNagMode(value: unknown): value is "fail" | "success" {
  return value === "fail" || value === "success";
}

function toPromptContext(aggregate: NagAggregate, personaId: NagPersonaId): NagPromptContext {
  return {
    mode: aggregate.mode,
    personaId,
    completedCount: aggregate.completedCount,
    totalCount: aggregate.totalCount,
    delayMinutesToday: aggregate.delayMinutesToday,
    pendingMissionTitles: aggregate.pendingMissionTitles,
    deadlineOverCount: aggregate.deadlineOverCount,
    focusMinutesToday: aggregate.focusMinutesToday,
    focusMinutesWeek: aggregate.focusMinutesWeek,
    currentStreak: aggregate.currentStreak,
  };
}

function buildNagMessage(
  quote: string,
  personaId: NagPersonaId,
  mode: "fail" | "success",
  weeklyScore: number,
): NagMessage {
  return {
    mode,
    quote,
    activePersonaId: personaId,
    personas: NAG_PERSONAS.map((persona) => ({ ...persona, score: weeklyScore })),
  };
}

async function collectNagAggregate(
  supabase: SupabaseClient,
): Promise<{ aggregate: NagAggregate } | { error: string }> {
  const now = new Date();
  const todayRange = getAppDayRange(getAppToday(now));
  const weekRange = getWeekRange(now);

  const [missionsResult, todayFocusResult, weekFocusResult, checkinsResult] = await Promise.all([
    supabase.from("missions").select(MISSION_SELECT).order("deadline", { ascending: true }),
    supabase
      .from("focus_sessions")
      .select("duration_min")
      .gte("started_at", todayRange.start)
      .lt("started_at", todayRange.end),
    supabase
      .from("focus_sessions")
      .select("duration_min")
      .gte("started_at", weekRange.start)
      .lt("started_at", weekRange.end),
    supabase.from("checkins").select("date, applications, problems").order("date", { ascending: false }).limit(400),
  ]);

  if (missionsResult.error) return { error: missionsResult.error.message };
  if (todayFocusResult.error) return { error: todayFocusResult.error.message };
  if (weekFocusResult.error) return { error: weekFocusResult.error.message };
  if (checkinsResult.error) return { error: checkinsResult.error.message };

  const missions = (missionsResult.data ?? []) as MissionForNag[];
  const completedMissions = missions.filter((mission) => mission.done);
  const pendingMissions = missions.filter((mission) => !mission.done);

  // "마감 초과 건수"와 "누적 지연 시간"은 같은 근거(마감을 넘긴 미완료 미션)에서 파생한다 —
  // checkins 기반 delayMinutesToday는 아직 실제로 집계되는 곳이 없어(항상 0), 실제 deadline
  // 초과분을 분 단위로 합산하는 쪽이 더 정확한 실데이터다.
  let deadlineOverCount = 0;
  let delayMinutesToday = 0;
  for (const mission of pendingMissions) {
    if (!mission.deadline) continue;
    const overdueMs = now.getTime() - new Date(mission.deadline).getTime();
    if (overdueMs > 0) {
      deadlineOverCount += 1;
      delayMinutesToday += Math.round(overdueMs / 60000);
    }
  }

  const focusMinutesToday = (todayFocusResult.data ?? []).reduce((sum, row) => sum + (row.duration_min ?? 0), 0);
  const focusMinutesWeek = (weekFocusResult.data ?? []).reduce((sum, row) => sum + (row.duration_min ?? 0), 0);

  const checkedInDates = resolveCheckedInDates(
    (checkinsResult.data ?? []) as CheckinDateRow[],
    completedMissions.map((mission) => mission.created_at),
  );
  const currentStreak = calculateStreak(checkedInDates, getTodayDateString(now));
  const weeklyScore = calculateWeeklyScore(checkedInDates, getWeekStartDateString(now));

  const totalCount = missions.length;
  const completedCount = completedMissions.length;
  const mode: "fail" | "success" = totalCount > 0 && completedCount === totalCount ? "success" : "fail";

  return {
    aggregate: {
      mode,
      completedCount,
      totalCount,
      deadlineOverCount,
      delayMinutesToday,
      pendingMissionTitles: pendingMissions.map((mission) => mission.title),
      focusMinutesToday,
      focusMinutesWeek,
      currentStreak,
      weeklyScore,
    },
  };
}

async function fetchLatestNagLog(supabase: SupabaseClient): Promise<{ log: NagLogRow | null } | { error: string }> {
  const { data, error } = await supabase
    .from("nag_logs")
    .select("content, context, regenerate_count")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };
  return { log: (data as NagLogRow | null) ?? null };
}

async function saveNagLog(
  supabase: SupabaseClient,
  quote: string,
  personaId: NagPersonaId,
  mode: "fail" | "success",
  regenerateCount: number,
) {
  const { error } = await supabase.from("nag_logs").insert({
    content: quote,
    context: { mode, personaId },
    regenerate_count: regenerateCount,
  });

  // nag_logs는 재현/디버깅용 기록이라, 저장에 실패해도 이미 생성된 메시지는 그대로 응답한다.
  if (error) console.error("nag_logs insert failed:", error.message);
}

interface ResolveNagMessageOptions {
  /** POST(명시적 재생성)에서만 true. true면 mode가 같아도 캐시를 재사용하지 않고 항상 새로 생성한다. */
  forceRegenerate: boolean;
  /** body로 명시된 personaId (POST에서 페르소나 탭을 바꿔 누른 경우) */
  requestedPersonaId?: NagPersonaId;
}

async function resolveNagMessage(
  supabase: SupabaseClient,
  aggregate: NagAggregate,
  latestLog: NagLogRow | null,
  options: ResolveNagMessageOptions,
): Promise<{ quote: string; personaId: NagPersonaId }> {
  const storedPersonaId = isNagPersonaId(latestLog?.context?.personaId) ? latestLog.context.personaId : undefined;
  const storedMode = isNagMode(latestLog?.context?.mode) ? latestLog.context.mode : undefined;

  // GET(단순 조회)에서만 캐시를 재사용한다 — POST는 사용자가 "한 번 더 때려줘"를 명시적으로
  // 눌러서 온 요청이라, mode가 이전과 같아도 항상 새로 생성해야 한다.
  const canReuseCache = !options.forceRegenerate && latestLog !== null && storedPersonaId !== undefined && storedMode === aggregate.mode;

  if (canReuseCache) {
    return { quote: latestLog.content, personaId: storedPersonaId };
  }

  const personaId = options.requestedPersonaId ?? storedPersonaId ?? NAG_PERSONAS[0].id;
  const quote = await generateNagMessage(toPromptContext(aggregate, personaId));
  const regenerateCount = options.forceRegenerate ? (latestLog?.regenerate_count ?? 0) + 1 : 0;
  await saveNagLog(supabase, quote, personaId, aggregate.mode, regenerateCount);

  return { quote, personaId };
}

export async function GET() {
  const supabase = await createClient();

  const aggregateResult = await collectNagAggregate(supabase);
  if ("error" in aggregateResult) {
    return NextResponse.json({ error: aggregateResult.error }, { status: 500 });
  }
  const { aggregate } = aggregateResult;

  const logResult = await fetchLatestNagLog(supabase);
  if ("error" in logResult) {
    return NextResponse.json({ error: logResult.error }, { status: 500 });
  }

  const { quote, personaId } = await resolveNagMessage(supabase, aggregate, logResult.log, { forceRegenerate: false });

  return NextResponse.json(buildNagMessage(quote, personaId, aggregate.mode, aggregate.weeklyScore));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { personaId?: NagPersonaId };
  const supabase = await createClient();

  const aggregateResult = await collectNagAggregate(supabase);
  if ("error" in aggregateResult) {
    return NextResponse.json({ error: aggregateResult.error }, { status: 500 });
  }
  const { aggregate } = aggregateResult;

  const logResult = await fetchLatestNagLog(supabase);
  if ("error" in logResult) {
    return NextResponse.json({ error: logResult.error }, { status: 500 });
  }

  const requestedPersonaId = isNagPersonaId(body.personaId) ? body.personaId : undefined;
  const { quote, personaId } = await resolveNagMessage(supabase, aggregate, logResult.log, {
    forceRegenerate: true,
    requestedPersonaId,
  });

  return NextResponse.json(buildNagMessage(quote, personaId, aggregate.mode, aggregate.weeklyScore));
}
