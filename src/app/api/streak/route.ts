import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { calculateStreak } from "@/entities/streak/model/calculateStreak";
import { calculateWeeklyScore } from "@/entities/streak/model/calculateWeeklyScore";
import { buildLast7Days } from "@/entities/streak/model/buildLast7Days";
import { getTodayDateString, getWeekStartDateString } from "@/entities/streak/model/date";
import { resolveCheckedInDates, type CheckinDateRow } from "@/entities/streak/model/resolveCheckedInDates";
import type { StreakSummary } from "@/entities/streak/model/types";

export async function GET() {
  const supabase = await createClient();

  const [checkinsResult, missionsResult] = await Promise.all([
    supabase.from("checkins").select("date, applications, problems").order("date", { ascending: false }).limit(400),
    supabase.from("missions").select("created_at").eq("done", true).order("created_at", { ascending: false }).limit(1000),
  ]);

  if (checkinsResult.error) {
    return NextResponse.json({ error: checkinsResult.error.message }, { status: 500 });
  }
  if (missionsResult.error) {
    return NextResponse.json({ error: missionsResult.error.message }, { status: 500 });
  }

  const checkedInDates = resolveCheckedInDates(
    (checkinsResult.data ?? []) as CheckinDateRow[],
    (missionsResult.data ?? []).map((row) => row.created_at as string),
  );

  const today = getTodayDateString();
  const thisWeekStart = getWeekStartDateString();
  const lastWeekStart = getWeekStartDateString(
    new Date(new Date(`${thisWeekStart}T00:00:00.000Z`).getTime() - 7 * 24 * 60 * 60 * 1000),
  );

  const thisWeekScore = calculateWeeklyScore(checkedInDates, thisWeekStart);
  const lastWeekScore = calculateWeeklyScore(checkedInDates, lastWeekStart);

  const summary: StreakSummary = {
    currentStreak: calculateStreak(checkedInDates, today),
    weeklyScore: thisWeekScore,
    weeklyScoreDelta: thisWeekScore - lastWeekScore,
    last7Days: buildLast7Days(checkedInDates, today),
  };

  return NextResponse.json(summary);
}
