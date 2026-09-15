import { NextResponse } from "next/server";
import { addMission, getMissions, setMissionCompletion } from "@/shared/lib/demo-store";
import type { CreateMissionInput } from "@/entities/mission/model/types";

export async function GET() {
  return NextResponse.json({ missions: getMissions() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateMissionInput;
  if (!body.topic || !body.todo || !body.deadline) {
    return NextResponse.json({ error: "topic, todo, deadline은 필수입니다." }, { status: 400 });
  }
  const mission = addMission(body);
  return NextResponse.json(mission, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id: string; isCompleted: boolean };
  const mission = setMissionCompletion(body.id, body.isCompleted);
  if (!mission) {
    return NextResponse.json({ error: "미션을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(mission);
}
