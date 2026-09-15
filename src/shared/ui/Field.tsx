import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[11.5px] font-bold tracking-[0.69px] text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full border-2 border-ink bg-transparent px-4.25 py-4 text-[15px] font-bold text-ink outline-none placeholder:text-ink-soft/60",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-start gap-2.25">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}
