"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";

/** Shared editor modal: title, body, save/cancel. */
export function EditorModal({
  open,
  title,
  busy,
  onClose,
  onSave,
  children,
  saveLabel = "Save",
}: {
  open: boolean;
  title: string;
  busy?: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
  saveLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        {children}
        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-wipe tap-spring min-h-11 rounded-full border border-rose px-5 text-sm font-semibold text-rose"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="tap-spring btn-circle-drop min-h-11 rounded-full bg-rose px-6 text-sm font-bold text-white hover:bg-rosedeep disabled:opacity-60"
          >
            {busy ? "saving…" : saveLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
