import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { toMission, type MissionRow } from "@/entities/mission/model/mapMissionRow";
import type { CreateMissionInput } from "@/entities/mission/model/types";

const MISSION_SELECT = "id, category, title, deadline, urgent, done, focus_sessions(duration_min)";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_SELECT)
    .order("deadline", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data as MissionRow[]).map(toMission));
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateMissionInput;
  if (!body.topic || !body.todo || !body.deadline) {
    return NextResponse.json({ error: "topic, todo, deadline은 필수입니다." }, { status: 400 });
  }

  const supabase = await createClient();
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
