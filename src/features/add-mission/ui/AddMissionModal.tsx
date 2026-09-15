"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Field, TextInput } from "@/shared/ui/Field";
import { cn } from "@/shared/lib/cn";
import { useAddMission } from "@/features/add-mission/model/useAddMission";

interface AddMissionModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddMissionModal({ open, onClose }: AddMissionModalProps) {
  const [topic, setTopic] = useState("");
  const [todo, setTodo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const addMission = useAddMission();

  function resetAndClose() {
    setTopic("");
    setTodo("");
    setDeadline("");
    setIsImportant(false);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!topic || !todo || !deadline) return;
    await addMission.mutateAsync({ topic, todo, deadline, isImportant });
    resetAndClose();
  }

  return (
    <Modal open={open} onClose={resetAndClose}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col border-[3px] border-ink bg-paper-2 shadow-brut-red"
      >
        <div className="flex w-full items-center justify-between border-b-2 border-ink px-5.5 py-4">
          <span className="font-display text-[21px] text-ink">미션 추가</span>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="닫기"
            className="flex size-7.5 items-center justify-center border-2 border-ink text-[12px] font-bold text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex w-full flex-col gap-5 p-5.5">
          <Field label="TOPIC">
            <TextInput
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="예: 코테"
              required
            />
          </Field>

          <Field label="TO DO">
            <TextInput
              value={todo}
              onChange={(event) => setTodo(event.target.value)}
              placeholder="예: 코테 2문제"
              required
            />
          </Field>

          <Field label="마감 시간">
            <TextInput
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              placeholder="13:00"
              required
            />
            <span className="text-[11.5px] font-semibold text-ink-soft">
              실제 집중 시간은 완료 시 자동으로 기록됩니다.
            </span>
          </Field>

          <div className="flex w-full items-center justify-between gap-4 border-2 border-red-soft px-4.5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-[22px] font-extrabold text-red-shadow">중요</span>
              <span className="text-[11.5px] font-semibold text-ink-soft">
                미루면 쓴소리 강도가 자동으로 올라갑니다.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsImportant((value) => !value)}
              aria-pressed={isImportant}
              className={cn(
                "flex size-6.5 shrink-0 items-center justify-center border-2 border-red-soft text-[12px] font-bold text-paper-3",
                isImportant ? "bg-red-shadow" : "bg-transparent",
              )}
            >
              {isImportant ? "✓" : ""}
            </button>
          </div>

          <div className="flex w-full gap-2.5 pt-0.5">
            <Button type="button" variant="outline" size="lg" onClick={resetAndClose}>
              취소
            </Button>
            <Button type="submit" variant="solid" size="lg" className="flex-1" disabled={addMission.isPending}>
              미션 추가
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
