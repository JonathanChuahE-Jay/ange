"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Generic admin list — rows: list-items/list-pop (pop in with spring overshoot,
 * swell+collapse exit), header with add button.
 */
export function ResourceList<T extends { id: number }>({
  title,
  hint,
  items,
  loading,
  onAdd,
  onEdit,
  onDelete,
  render,
  addLabel = "Add",
  emptyHint = "Nothing here yet — add the first one.",
}: {
  title: string;
  hint?: string;
  items: T[] | undefined;
  loading: boolean;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  render: (item: T) => ReactNode;
  addLabel?: string;
  emptyHint?: string;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-[13px] text-inksoft">{hint}</p>}
        </div>
        <button
          onClick={onAdd}
          className="tap-spring btn-circle-drop inline-flex min-h-10 items-center gap-2 rounded-full bg-rose px-5 text-sm font-bold text-white hover:bg-rosedeep"
        >
          <span className="icon-[lucide--plus] size-4" /> {addLabel}
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        )}
        {!loading && items && items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-inksoft">
            {emptyHint}
          </p>
        )}
        <AnimatePresence initial={false}>
          {items?.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 22,
                opacity: { duration: 0.12 },
              }}
              className="flex items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">{render(item)}</div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => onEdit(item)}
                  aria-label="Edit"
                  className="flex size-10 items-center justify-center rounded-xl text-inksoft transition-colors hover:bg-rosemist hover:text-rose"
                >
                  <span className="icon-[lucide--pencil] size-[18px]" />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  aria-label="Delete"
                  className="flex size-10 items-center justify-center rounded-xl text-inksoft transition-colors hover:bg-rose-soft hover:text-rosedeep"
                >
                  <span className="icon-[lucide--trash-2] size-[18px]" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
