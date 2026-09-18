"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { TimerDisplay } from "@/entities/focus-session/ui/TimerDisplay";
import { useFocusSession } from "@/entities/focus-session/model/useFocusSession";
import { usePausedMarker, useSetPausedMarker } from "@/entities/focus-session/model/pausedMarker";
import { useStartFocusSession } from "@/features/start-focus-session/model/useStartFocusSession";
import { useMissions } from "@/entities/mission/model/useMissions";
import type { FocusSession, FocusSessionStatus } from "@/entities/focus-session/model/types";

const STATUS_LABEL: Record<FocusSessionStatus, string> = {
  idle: "대기 중",
  running: "진행 중",
  paused: "일시정지",
  stopped: "중지됨",
};

// 서버(DB)는 "일시정지"를 표현하는 컬럼이 없어 idle|running만 안다 — 일시정지는
// 순수 프론트 상태로만 존재한다.
type LocalStatus = "idle" | "running" | "paused";

export function FocusTimerPanel() {
  const { data: session } = useFocusSession();
  const { data: missions = [] } = useMissions();
  const { data: pausedMarker } = usePausedMarker();
  const setPausedMarker = useSetPausedMarker();
  const updateFocusSession = useStartFocusSession();

  const [status, setStatus] = useState<LocalStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [syncedSession, setSyncedSession] = useState<FocusSession | null>(null);

  // 서버 세션이 바뀌면(초기 로드, 다른 미션의 "집중 시작" 등) 동기화한다.
  // 로컬이 일시정지 중이고 그 일시정지가 아직 해소되지 않은 동안(pausedMarker가
  // 남아있는 동안)은 서버가 (아직 열려 있는 세그먼트 때문에) running으로 보고하므로
  // 이 refetch로 화면 숫자가 다시 흐르지 않도록 건너뛴다. 다른 미션을 새로 시작해
  // pausedMarker가 지워지면(useStartFocusSession이 처리) 곧바로 그 새 세션으로
  // 동기화한다.
  const isPendingLocalPause = status === "paused" && pausedMarker !== null;
  if (session && session !== syncedSession && !isPendingLocalPause) {
    setSyncedSession(session);
    setStatus(session.status === "running" ? "running" : "idle");
    setElapsedSeconds(session.elapsedSeconds);
  }

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (!session) {
    return <div className="h-57.75 w-full animate-pulse border-2 border-ink bg-surface-muted" />;
  }

  const missionId = session.missionId ?? undefined;
  const currentMission = missions.find((mission) => mission.id === session.missionId);
  const displaySeconds = currentMission?.isCompleted ? 0 : elapsedSeconds;

  function start() {
    updateFocusSession.mutate(
      { missionId, action: "start" },
      {
        onSuccess: (data) => {
          setStatus("running");
          setElapsedSeconds(data.elapsedSeconds);
        },
      },
    );
  }

  function pause() {
    setPausedMarker({ missionId: missionId ?? null, pausedAt: new Date().toISOString() });
    setStatus("paused");
  }

  function resume() {
    updateFocusSession.mutate(
      { missionId, action: "resume", endedAt: pausedMarker?.pausedAt },
      {
        onSuccess: (data) => {
          setStatus("running");
          setElapsedSeconds(data.elapsedSeconds);
        },
      },
    );
  }

  function stop() {
    updateFocusSession.mutate(
      { action: "stop", endedAt: status === "paused" ? pausedMarker?.pausedAt : undefined },
      {
        onSuccess: (data) => {
          setStatus("idle");
          setElapsedSeconds(data.elapsedSeconds);
        },
      },
    );
  }

  return (
    <Panel className="flex w-full flex-col gap-3.25 px-5 py-4.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-[18px] text-ink">집중 타이머</span>
        <span className="text-[12px] font-semibold text-ink-soft">
          {session.missionTitle ? `${session.missionTitle} · ` : ""}
          {STATUS_LABEL[status]}
        </span>
      </div>

      <TimerDisplay seconds={displaySeconds} />

      {session.deadlineLabel ? (
        <div className="text-right text-[11.5px] font-semibold text-ink-soft">
          마감까지 {session.deadlineLabel}
        </div>
      ) : null}

      <div className="flex gap-2">
        {status === "running" ? (
          <>
            <Button variant="outline" size="sm" className="flex-1" onClick={pause}>
              일시정지
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={stop}
              disabled={updateFocusSession.isPending}
            >
              중지
            </Button>
          </>
        ) : status === "paused" ? (
          <>
            <Button
              variant="solid"
              size="sm"
              className="flex-1"
              onClick={resume}
              disabled={updateFocusSession.isPending}
            >
              재개
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={stop}
              disabled={updateFocusSession.isPending}
            >
              중지
            </Button>
          </>
        ) : (
          <Button
            variant="solid"
            size="sm"
            className="flex-1"
            onClick={start}
            disabled={updateFocusSession.isPending}
          >
            집중 시작
          </Button>
        )}
      </div>
    </Panel>
  );
}
