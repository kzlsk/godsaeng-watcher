"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/cn";

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

// 중앙(선택된 항목)에서 몇 칸 떨어졌는지에 따라 iOS 피커처럼 크기/농도를 단계적으로 낮춘다.
function distanceStyle(distance: number) {
  if (distance === 0) return "scale-100 opacity-100 text-[24px] font-extrabold text-ink";
  if (distance === 1) return "scale-90 opacity-45 text-[19px] font-bold text-ink-soft";
  return "scale-80 opacity-20 text-[17px] font-semibold text-ink-soft";
}

interface WheelColumnProps {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}

function WheelColumn({ values, value, onChange, ariaLabel }: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const index = values.indexOf(value);
    if (index === -1) return;
    const target = index * ITEM_HEIGHT;
    if (Math.abs(container.scrollTop - target) > 1) {
      container.scrollTo({ top: target });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, values.join(",")]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const index = Math.min(
        Math.max(Math.round(container.scrollTop / ITEM_HEIGHT), 0),
        values.length - 1,
      );
      const next = values[index];
      if (next !== value) onChange(next);
      container.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
    }, 120);
  }

  const selectedIndex = Math.max(values.indexOf(value), 0);

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      className="h-55 w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth scrollbar-none"
      style={{ paddingBlock: ITEM_HEIGHT * ((VISIBLE_ROWS - 1) / 2) }}
    >
      {values.map((item, index) => (
        <button
          key={item}
          type="button"
          role="option"
          aria-selected={item === value}
          onClick={() => onChange(item)}
          className={cn(
            "flex h-11 w-full shrink-0 snap-center items-center justify-center tabular-nums transition-all duration-150",
            distanceStyle(Math.abs(index - selectedIndex)),
          )}
        >
          {pad(item)}
        </button>
      ))}
    </div>
  );
}

interface DeadlineWheelPickerProps {
  hours: number[];
  minutes: number[];
  hour: number;
  minute: number;
  onChangeHour: (hour: number) => void;
  onChangeMinute: (minute: number) => void;
}

export function DeadlineWheelPicker({
  hours,
  minutes,
  hour,
  minute,
  onChangeHour,
  onChangeMinute,
}: DeadlineWheelPickerProps) {
  return (
    <div className="relative flex w-full items-center gap-3 border-2 border-ink bg-paper-3 px-3 py-1">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-1/2 h-11 -translate-y-1/2 border-y-2 border-ink"
      />
      <WheelColumn values={hours} value={hour} onChange={onChangeHour} ariaLabel="시" />
      <span className="text-[22px] font-extrabold text-ink">:</span>
      <WheelColumn values={minutes} value={minute} onChange={onChangeMinute} ariaLabel="분" />
    </div>
  );
}
