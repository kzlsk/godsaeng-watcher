import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { toMission, type MissionRow } from "@/entities/mission/model/mapMissionRow";
import type { UpdateMissionInput } from "@/entities/mission/model/types";

const MISSION_SELECT = "id, category, title, deadline, urgent, done, focus_sessions(duration_min)";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as UpdateMissionInput;

  const updates: Record<string, unknown> = {};
  if (body.topic !== undefined) updates.category = body.topic;
  if (body.todo !== undefined) updates.title = body.todo;
  if (body.deadline !== undefined) updates.deadline = body.deadline;
  if (body.isImportant !== undefined) updates.urgent = body.isImportant;
  if (body.isCompleted !== undefined) updates.done = body.isCompleted;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("missions")
    .update(updates)
    .eq("id", id)
    .select(MISSION_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: "미션을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(toMission(data as MissionRow));
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.from("missions").delete().eq("id", id).select("id").single();

  if (error || !data) {
    return NextResponse.json({ error: "미션을 찾을 수 없습니다." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
