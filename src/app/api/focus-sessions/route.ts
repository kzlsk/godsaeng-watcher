import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { toFocusSession, type FocusSessionRow } from "@/entities/focus-session/model/mapFocusSessionRow";
import { getTodayRange } from "@/entities/focus-session/model/dateRange";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const FOCUS_SESSION_SELECT =
  "id, mission_id, started_at, ended_at, missions(title, deadline, duration_min)";

async function fetchTodaySession(supabase: SupabaseClient) {
  const { start, end } = getTodayRange();
  return supabase
    .from("focus_sessions")
    .select(FOCUS_SESSION_SELECT)
    .gte("started_at", start)
    .lt("started_at", end)
    .order("started_at", { ascending: false });
}

async function closeOpenSession(supabase: SupabaseClient) {
  const { data: openRow, error: openError } = await supabase
    .from("focus_sessions")
    .select("id, started_at")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openError) return { error: openError };
  if (!openRow) return { error: null };

  const endedAt = new Date();
  const durationMin = Math.max(0, Math.round((endedAt.getTime() - new Date(openRow.started_at).getTime()) / 60000));

  const { error } = await supabase
    .from("focus_sessions")
    .update({ ended_at: endedAt.toISOString(), duration_min: durationMin })
    .eq("id", openRow.id);

  return { error };
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await fetchTodaySession(supabase);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toFocusSession((data ?? []) as unknown as FocusSessionRow[]));
}

export async function POST(request: Request) {
  const body = (await request.json()) as { missionId?: string; action: "start" | "pause" | "resume" };
  const supabase = await createClient();

  if (body.action === "start" || body.action === "resume") {
    const { error: closeError } = await closeOpenSession(supabase);
    if (closeError) {
      return NextResponse.json({ error: closeError.message }, { status: 500 });
    }

    const { error: insertError } = await supabase
      .from("focus_sessions")
      .insert({ mission_id: body.missionId ?? null, started_at: new Date().toISOString() });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    const { error: closeError } = await closeOpenSession(supabase);
    if (closeError) {
      return NextResponse.json({ error: closeError.message }, { status: 500 });
    }
  }

  const { data, error } = await fetchTodaySession(supabase);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toFocusSession((data ?? []) as unknown as FocusSessionRow[]));
}
