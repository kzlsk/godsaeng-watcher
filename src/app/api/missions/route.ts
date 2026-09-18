import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import {
  toMission,
  type MissionRow,
} from "@/entities/mission/model/mapMissionRow";
import type { CreateMissionInput } from "@/entities/mission/model/types";
import { getAppToday } from "@/shared/lib/date/getAppToday";

const MISSION_SELECT =
  "id, category, title, deadline, urgent, done, created_at, focus_sessions(duration_min, started_at)";

// missions 테이블에는 "완료 시각" 컬럼이 없어(스키마 변경은 이번 스코프 밖), 생성일(created_at)을
// 완료된 날의 근사치로 사용한다. entities/streak가 스트릭 계산에 쓰는 것과 같은 근사 방식이다.
function isDoneBeforeToday(row: MissionRow, today: string): boolean {
  if (!row.done) return false;
  return getAppToday(new Date(row.created_at)) < today;
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_SELECT)
    .order("deadline", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = getAppToday();
  const rows = data as MissionRow[];
  const missions = rows.filter((row) => !isDoneBeforeToday(row, today)).map((row) => toMission(row, today));

  return NextResponse.json(missions);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateMissionInput;
  if (!body.topic || !body.todo) {
    return NextResponse.json(
      { error: "topic, todo는 필수입니다." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  console.log("SERVER SEES USER:", user, userError);

  const { data, error } = await supabase
    .from("missions")
    .insert({
      category: body.topic,
      title: body.todo,
      deadline: body.deadline,
      urgent: body.isImportant,
    })
    .select(MISSION_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toMission(data as MissionRow), { status: 201 });
}
