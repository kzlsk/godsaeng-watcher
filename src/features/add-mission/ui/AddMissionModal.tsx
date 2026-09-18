"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Field, TextInput } from "@/shared/ui/Field";
import { cn } from "@/shared/lib/cn";
import { useAddMission } from "@/features/add-mission/model/useAddMission";
import { DeadlineWheelPicker } from "@/features/add-mission/ui/DeadlineWheelPicker";
import { computeDefaultDeadlineTime } from "@/features/add-mission/ui/computeDefaultDeadlineTime";
import { minutesForHour, selectableHours } from "@/features/add-mission/ui/deadlineTimeRange";

interface AddMissionModalProps {
  open: boolean;
  onClose: () => void;
}

// "지금 이 화면에서 마감 시각을 고를 수 있는 범위"를 30초마다 최신화한다. 이 화면은
// 오늘 자정을 넘는 입력을 만들지 않는 것을 전제로 하므로(007의 toDeadlineIso 자정 롤오버는
// 여기서는 발생하지 않음), 시간이 흘러 이미 지난 값이 되면 다음 유효한 시각으로 당겨온다.
const NOW_TICK_MS = 30_000;

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function AddMissionModal({ open, onClose }: AddMissionModalProps) {
  const [topic, setTopic] = useState("");
  const [todo, setTodo] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState(() => computeDefaultDeadlineTime());
  const [isImportant, setIsImportant] = useState(false);
  const addMission = useAddMission();

  // 모달이 닫혀 있는 동안(마운트 이후 오래 지난 경우 포함) now가 오래된 값일 수 있으므로,
  // 열리는 시점에 렌더 중 바로 최신 시각으로 맞춘다("prop이 바뀌면 상태를 조정하는" React의
  // 공식 패턴 — useEffect 안에서 동기적으로 setState하면 이 프로젝트 lint 규칙에 걸림).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const freshNow = new Date();
      setNow(freshNow);
      setDeadlineTime(computeDefaultDeadlineTime(freshNow));
    }
  }

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      const nextNow = new Date();
      setNow(nextNow);
      setDeadlineTime((prev) => {
        const prevMinutes = prev.hour * 60 + prev.minute;
        const nowMinutes = nextNow.getHours() * 60 + nextNow.getMinutes();
        return prevMinutes >= nowMinutes ? prev : computeDefaultDeadlineTime(nextNow);
      });
    }, NOW_TICK_MS);
    return () => clearInterval(interval);
  }, [open]);

  const hourOptions = selectableHours(now);
  const minuteOptions = minutesForHour(deadlineTime.hour, now);
  const deadline = deadlineEnabled ? `${pad(deadlineTime.hour)}:${pad(deadlineTime.minute)}` : "";

  function handleChangeHour(hour: number) {
    setDeadlineTime((prev) => {
      const minutes = minutesForHour(hour, now);
      const minute = minutes.includes(prev.minute) ? prev.minute : minutes[0];
      return { hour, minute };
    });
  }

  function resetAndClose() {
    setTopic("");
    setTodo("");
    setDeadlineEnabled(false);
    setIsImportant(false);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!topic || !todo) return;
    await addMission.mutateAsync({ topic, todo, deadline: deadline || undefined, isImportant });
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
            <div className="flex w-full items-center justify-between">
              <span className="text-[13px] font-bold text-ink">
                {deadlineEnabled ? `오늘 ${pad(deadlineTime.hour)}:${pad(deadlineTime.minute)} 마감` : "마감 없음"}
              </span>
              <button
                type="button"
                onClick={() => setDeadlineEnabled((value) => !value)}
                className="border-2 border-ink px-3 py-1.5 text-[11.5px] font-bold text-ink hover:bg-surface-muted"
              >
                {deadlineEnabled ? "마감 없음" : "마감 설정"}
              </button>
            </div>
            {deadlineEnabled && (
              <DeadlineWheelPicker
                hours={hourOptions}
                minutes={minuteOptions}
                hour={deadlineTime.hour}
                minute={deadlineTime.minute}
                onChangeHour={handleChangeHour}
                onChangeMinute={(minute) => setDeadlineTime((prev) => ({ ...prev, minute }))}
              />
            )}
            <span className="text-[11.5px] font-semibold text-ink-soft">
              실제 집중 시간은 완료 시 자동으로 기록됩니다. 마감은 오늘 안에서만 고를 수 있어요.
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
