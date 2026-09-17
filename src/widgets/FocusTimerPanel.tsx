"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { TimerDisplay } from "@/entities/focus-session/ui/TimerDisplay";
import { useFocusSession } from "@/entities/focus-session/model/useFocusSession";
import { useStartFocusSession } from "@/features/start-focus-session/model/useStartFocusSession";
import type { FocusSessionStatus } from "@/entities/focus-session/model/types";

const STATUS_LABEL: Record<FocusSessionStatus, string> = {
  idle: "대기 중",
  running: "진행 중",
  paused: "일시정지",
  stopped: "중지됨",
};

export function FocusTimerPanel() {
  const { data: session } = useFocusSession();
  const startFocusSession = useStartFocusSession();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [syncedElapsedSeconds, setSyncedElapsedSeconds] = useState<number | null>(null);

  if (session && session.elapsedSeconds !== syncedElapsedSeconds) {
    setSyncedElapsedSeconds(session.elapsedSeconds);
    setElapsedSeconds(session.elapsedSeconds);
  }

  useEffect(() => {
    if (session?.status !== "running") return;
    const interval = setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.status]);

  if (!session) {
    return <div className="h-57.75 w-full animate-pulse border-2 border-ink bg-surface-muted" />;
  }

  const missionId = session.missionId ?? undefined;

  function start() {
    startFocusSession.mutate({ missionId, action: "start" });
  }
  function resume() {
    startFocusSession.mutate({ missionId, action: "resume" });
  }
  function pause() {
    startFocusSession.mutate({ action: "pause" });
  }
  function stop() {
    startFocusSession.mutate({ action: "stop" });
  }

  return (
    <Panel className="flex w-full flex-col gap-3.25 px-5 py-4.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-[18px] text-ink">집중 타이머</span>
        <span className="text-[12px] font-semibold text-ink-soft">
          {session.missionTitle ? `${session.missionTitle} · ` : ""}
          {STATUS_LABEL[session.status]}
        </span>
      </div>

      <TimerDisplay seconds={elapsedSeconds} />

      {session.deadlineLabel ? (
        <div className="text-right text-[11.5px] font-semibold text-ink-soft">
          마감까지 {session.deadlineLabel}
        </div>
      ) : null}

      <div className="flex gap-2">
        {session.status === "running" ? (
          <>
            <Button variant="outline" size="sm" className="flex-1" onClick={pause}>
              일시정지
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={stop}>
              중지
            </Button>
          </>
        ) : session.status === "paused" ? (
          <>
            <Button variant="solid" size="sm" className="flex-1" onClick={resume}>
              재개
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={stop}>
              중지
            </Button>
          </>
        ) : (
          <Button variant="solid" size="sm" className="flex-1" onClick={start}>
            시작
          </Button>
        )}
      </div>
    </Panel>
  );
}
