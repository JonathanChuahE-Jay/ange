"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

type FieldShellProps = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor: string;
};

export function FieldShell({ label, error, hint, children, htmlFor }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-inksoft">
        {label}
      </label>
      {children}
      {error ? (
        <p className="wrap text-[13px] text-rosedeep" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-inksoft/70">{hint}</p>
      ) : null}
    </div>
  );
}

/** Inputs — focus: inputs/ring-scale-in (global .input-ring). */
export function TextField({
  label,
  error,
  hint,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id}>
      <input
        id={id}
        className={`input-ring min-h-11 rounded-xl border border-line bg-white px-4 text-[15px] text-ink placeholder:text-inksoft/50 ${error ? "border-rosedeep" : ""} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  error,
  hint,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        className={`input-ring wrap min-h-28 rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink placeholder:text-inksoft/50 ${error ? "border-rosedeep" : ""} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
}
