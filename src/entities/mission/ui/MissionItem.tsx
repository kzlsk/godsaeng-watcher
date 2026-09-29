"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import type { Mission } from "@/entities/mission/model/types";
import { formatMissionDeadline } from "@/entities/mission/ui/formatMissionDeadline";

interface MissionItemProps {
  mission: Mission;
  onToggle: () => void;
  onStartFocus: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="size-4" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" strokeLinecap="square" />
    </svg>
  );
}

export function MissionItem({ mission, onToggle, onStartFocus, onDelete, isDeleting = false }: MissionItemProps) {
  const { topic, todo, deadline, isImportant, isCompleted, actualFocusMinutes, overdueDays } = mission;
  const deadlineText = formatMissionDeadline(deadline);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center gap-3.25 border-b-2 border-border-soft px-5 py-3.5 last:border-b-0",
        !isCompleted && isImportant && "border-l-[5px] border-l-red-shadow bg-red-tint pl-3.75",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isCompleted ? "미션 완료 취소" : "미션 완료 처리"}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border-2 text-[11px] font-bold",
          isCompleted ? "border-green bg-green text-paper-3" : "border-ink bg-transparent",
        )}
      >
        {isCompleted ? "✓" : ""}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <span
          className={cn(
            "truncate text-[14px] font-medium text-ink",
            isCompleted && "text-ink-soft line-through",
          )}
        >
          {todo}
        </span>
        <span className="truncate text-[12px] font-semibold text-ink-soft">
          {topic}
          {deadlineText ? ` · ${deadlineText}` : ""}
          {actualFocusMinutes ? ` · ${actualFocusMinutes}분` : ""}
        </span>
      </div>

      {isImportant ? <Badge variant="danger">중요</Badge> : null}
      {overdueDays && overdueDays > 0 ? <Badge variant="solid">{overdueDays}일 지연</Badge> : null}

      {isConfirmingDelete ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[12px] font-bold text-red-shadow">삭제할까요?</span>
          <Button variant="solid" size="sm" onClick={onDelete} disabled={isDeleting}>
            삭제
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting}>
            취소
          </Button>
        </div>
      ) : (
        <>
          {isCompleted ? (
            <Badge variant="success">완료</Badge>
          ) : (
            <Button variant="solid" size="sm" onClick={onStartFocus}>
              집중 시작
            </Button>
          )}
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            aria-label="미션 삭제"
            title="미션 삭제"
            className="flex size-7.5 shrink-0 items-center justify-center border-2 border-transparent text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <TrashIcon />
          </button>
        </>
      )}
    </div>
  );
}
