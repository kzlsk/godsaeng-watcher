import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { toFocusSession, type FocusSessionRow } from "@/entities/focus-session/model/mapFocusSessionRow";
import { getAppDayRange } from "@/shared/lib/date/getAppToday";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const FOCUS_SESSION_SELECT =
  "id, mission_id, started_at, ended_at, missions(title, deadline, duration_min)";

// 미션은 하루 단위 개념이라 "DB 누적 집중시간"(idle일 때 화면에 표시되는 기준값)도
// 오늘(새벽 2시 컷오프 기준, getAppDayRange) 범위로만 계산한다.
async function fetchTodaySession(supabase: SupabaseClient) {
  const { start, end } = getAppDayRange();
  return supabase
    .from("focus_sessions")
    .select(FOCUS_SESSION_SELECT)
    .gte("started_at", start)
    .lt("started_at", end)
    .order("started_at", { ascending: false });
}

type OpenSessionRow = { id: string; started_at: string };

async function findOpenSession(supabase: SupabaseClient) {
  return supabase
    .from("focus_sessions")
    .select("id, started_at")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<OpenSessionRow>();
}

// endedAt을 명시하지 않으면 "지금" 시점에 세그먼트를 닫는다. 일시정지 중 재개/중지할
// 때는 호출부가 일시정지 시점을 endedAt으로 넘겨서, 일시정지해 있던 시간이
// duration_min에 섞여 들어가지 않도록 한다.
async function closeSession(supabase: SupabaseClient, openRow: OpenSessionRow | null, endedAt: Date) {
  if (!openRow) return { error: null };

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
  const body = (await request.json()) as {
    missionId?: string;
    action: "start" | "resume" | "stop";
    endedAt?: string;
  };
  const supabase = await createClient();
  const endedAt = body.endedAt ? new Date(body.endedAt) : new Date();

  const { data: openRow, error: openError } = await findOpenSession(supabase);
  if (openError) {
    return NextResponse.json({ error: openError.message }, { status: 500 });
  }

  if (body.action === "start" || body.action === "resume") {
    // 닫을 세그먼트는 위에서 id로 이미 특정했으므로, "기존 세그먼트 마감(update)"과
    // "새 세그먼트 생성(insert)"은 서로 결과에 의존하지 않는다 → 병렬로 보내 DB 왕복 1회를 줄인다.
    const [closeResult, insertResult] = await Promise.all([
      closeSession(supabase, openRow, endedAt),
      supabase
        .from("focus_sessions")
        .insert({ mission_id: body.missionId ?? null, started_at: new Date().toISOString() })
        .select("id")
        .single<{ id: string }>(),
    ]);

    if (closeResult.error) {
      // 순차 처리하던 때와 같은 결과(마감 실패 시 새 세그먼트 없음)를 유지하기 위해, 이미 만들어진
      // 새 세그먼트를 되돌린다. 남겨두면 열린 세그먼트가 2개가 되어 누적 시간이 계속 늘어난다.
      if (insertResult.data) {
        await supabase.from("focus_sessions").delete().eq("id", insertResult.data.id);
      }
      return NextResponse.json({ error: closeResult.error.message }, { status: 500 });
    }
    if (insertResult.error) {
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
    }
  } else {
    // stop: 열린 세그먼트를 마감만 하고 새 세그먼트는 만들지 않는다 → idle로 복귀.
    const { error: closeError } = await closeSession(supabase, openRow, endedAt);
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
