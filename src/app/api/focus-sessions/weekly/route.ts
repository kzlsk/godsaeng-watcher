import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { getWeekRange } from "@/entities/focus-session/model/dateRange";
import type { WeeklyFocusSummary } from "@/entities/focus-session/model/types";

export async function GET() {
  const { start, end } = getWeekRange();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("duration_min")
    .gte("started_at", start)
    .lt("started_at", end);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalMinutes = (data ?? []).reduce((sum, row) => sum + (row.duration_min ?? 0), 0);
  const summary: WeeklyFocusSummary = { totalMinutes, weekStart: start };

  return NextResponse.json(summary);
}
