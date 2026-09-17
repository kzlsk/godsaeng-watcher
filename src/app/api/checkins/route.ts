import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { toCheckinRecord, type CheckinRow } from "@/entities/checkin/model/mapCheckinRow";
import { getDayRange, getTodayDateString } from "@/entities/checkin/model/date";
import type { DailyStats, UpsertCheckinInput } from "@/entities/checkin/model/types";

const CHECKIN_SELECT = "date, applications, problems";

function resolveDate(searchParams: URLSearchParams): string {
  const date = searchParams.get("date");
  if (!date || date === "today") return getTodayDateString();
  return date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = resolveDate(searchParams);
  const { start, end } = getDayRange(date);

  const supabase = await createClient();

  const [checkinResult, focusResult] = await Promise.all([
    supabase.from("checkins").select(CHECKIN_SELECT).eq("date", date).maybeSingle(),
    supabase.from("focus_sessions").select("duration_min").gte("started_at", start).lt("started_at", end),
  ]);

  if (checkinResult.error) {
    return NextResponse.json({ error: checkinResult.error.message }, { status: 500 });
  }
  if (focusResult.error) {
    return NextResponse.json({ error: focusResult.error.message }, { status: 500 });
  }

  const checkin = toCheckinRecord((checkinResult.data as CheckinRow | null) ?? { date, applications: 0, problems: 0 });
  const totalFocusMinutes = (focusResult.data ?? []).reduce((sum, row) => sum + (row.duration_min ?? 0), 0);

  const response: DailyStats & typeof checkin = {
    totalFocusMinutes,
    focusAheadMinutes: 0,
    delayMinutesToday: 0,
    delayMinutesWeek: 0,
    ...checkin,
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as UpsertCheckinInput;
  const date = getTodayDateString();

  const payload: Record<string, unknown> = { date };
  if (typeof body.applications === "number") payload.applications = body.applications;
  if (typeof body.problems === "number") payload.problems = body.problems;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checkins")
    .upsert(payload, { onConflict: "user_id,date" })
    .select(CHECKIN_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toCheckinRecord(data as CheckinRow));
}
