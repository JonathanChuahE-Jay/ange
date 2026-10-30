"use client";

import { motion } from "motion/react";
import { useId } from "react";

type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
};

/** Toggle — spec: selection-controls/springy (knob spring 500/28, ≤300ms). */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-[13px] font-semibold text-inksoft">
        {label}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-rose" : "bg-line"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className="absolute top-1 size-5 rounded-full bg-white shadow-md"
          style={{ left: checked ? "calc(100% - 24px)" : "4px" }}
        />
      </button>
    </div>
  );
}
