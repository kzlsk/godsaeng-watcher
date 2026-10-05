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
  const isOverdue = Boolean(overdueDays && overdueDays > 0);
  const showStartFocus = !isCompleted && !isConfirmingDelete;

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 border-b-2 border-border-soft px-5 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        !isCompleted && isImportant && "border-l-[5px] border-l-red-shadow bg-red-tint pl-3.75",
      )}
    >
      {/* 좌측: 상태 표시(체크박스 · 중요/지연)와 할 일 텍스트. 완료 여부는 체크박스로만 표시한다. */}
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isCompleted ? "미션 완료 취소" : "미션 완료 처리"}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center border-2 text-[11px] font-bold",
            isCompleted ? "border-green bg-green text-paper-3" : "border-line-strong bg-transparent",
          )}
        >
          {isCompleted ? "✓" : ""}
        </button>
        {isImportant ? (
          <Badge variant="danger" className="shrink-0">
            중요
          </Badge>
        ) : null}
        {isOverdue ? (
          <Badge variant="solid" className="shrink-0">
            {overdueDays}일 지연
          </Badge>
        ) : null}
        {/*
          모바일(sm 미만)에서는 좁은 폭 때문에 제목이 한 줄 말줄임(...)으로 잘려 내용을 알 수 없었다.
          그래서 줄바꿈해서 전부 보여준다. wrap-anywhere는 공백 없는 긴 문자열(URL 등)도 칸을 넘지
          않게 하기 위한 것이고, 한글은 기본 줄바꿈 규칙으로 알아서 접힌다.
          sm 이상은 폭이 넉넉하고 기존 디자인을 유지해야 해서 그대로 한 줄 말줄임이다.
        */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <span
            className={cn(
              "wrap-anywhere text-[14px] font-medium text-ink sm:truncate",
              isCompleted && "text-ink-soft line-through",
            )}
          >
            {todo}
          </span>
          <span className="wrap-anywhere text-[12px] font-semibold text-ink-soft sm:truncate">
            {topic}
            {deadlineText ? ` · ${deadlineText}` : ""}
            {actualFocusMinutes ? ` · ${actualFocusMinutes}분` : ""}
          </span>
        </div>
      </div>

      {/* 우측: 실행 버튼. 집중 시작과 삭제 사이는 넓은 간격 + 구분선으로 떼어 오터치를 막는다. */}
      <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
        {showStartFocus ? (
          <Button variant="solid" size="sm" onClick={onStartFocus}>
            집중 시작
          </Button>
        ) : null}
        <div className="flex shrink-0 items-center border-l-2 border-border-soft pl-3">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-red-shadow">삭제할까요?</span>
              <Button variant="solid" size="sm" onClick={onDelete} disabled={isDeleting}>
                삭제
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting}>
                취소
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              aria-label="미션 삭제"
              title="미션 삭제"
              className="flex size-7.5 items-center justify-center border-2 border-transparent text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
