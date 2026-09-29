"use client";

import { useId } from "react";
import { describeIntensity } from "@/features/regenerate-nag/ui/describeIntensity";

interface NagIntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// 쓴소리 배너(빨강/초록 배경) 위에 올라가므로 글자/트랙 색은 paper-3 기준으로 맞춘다.
export function NagIntensitySlider({ value, onChange, disabled = false }: NagIntensitySliderProps) {
  const inputId = useId();
  const label = describeIntensity(value);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between text-[12px] font-bold text-paper-3">
        <label htmlFor={inputId}>강도</label>
        <span>
          {value} · {label}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        aria-valuetext={`${value}, ${label}`}
        className="w-full cursor-pointer accent-paper-3 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex justify-between text-[11px] font-semibold text-paper-3/70">
        <span>0 담백</span>
        <span>100 최대</span>
      </div>
    </div>
  );
}
