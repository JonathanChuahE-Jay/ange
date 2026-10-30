"use client";

import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <h2 id="confirm-title" className="font-display text-2xl text-ink">
        {title}
      </h2>
      <p className="wrap mt-3 text-[15px] text-inksoft" data-multiline="">
        {message}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="btn-wipe tap-spring min-h-11 rounded-full border border-rose px-5 text-sm font-semibold text-rose"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          autoFocus
          className={`tap-spring min-h-11 rounded-full px-5 text-sm font-semibold text-white ${
            danger ? "bg-rosedeep hover:bg-rose" : "bg-rose hover:bg-rosedeep"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
