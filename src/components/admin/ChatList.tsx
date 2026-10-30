"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import type { ChatQuote } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Draggable list of chat messages. The order here IS the order the messages
 * appear in the WhatsApp phone on the public site.
 */
export function ChatList({
  items,
  loading,
  onEdit,
  onDelete,
  onReorder,
  render,
}: {
  items: ChatQuote[] | undefined;
  loading: boolean;
  onEdit: (item: ChatQuote) => void;
  onDelete: (item: ChatQuote) => void;
  onReorder: (ids: number[]) => void;
  render?: (item: ChatQuote) => ReactNode;
}) {
  const [order, setOrder] = useState<ChatQuote[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // keep a local copy in sync with the server list
  useEffect(() => {
    if (items) setOrder(items);
  }, [items]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.findIndex((c) => c.id === active.id);
    const to = order.findIndex((c) => c.id === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(order, from, to);
    setOrder(next); // optimistic
    onReorder(next.map((c) => c.id));
  };

  return (
    <div className="mt-6">
      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      )}
      {!loading && order.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-inksoft">
          Nothing here yet — add the first message.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {order.map((c, i) => (
                <SortableChatRow
                  key={c.id}
                  item={c}
                  index={i}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  render={render}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableChatRow({
  item,
  index,
  onEdit,
  onDelete,
  render,
}: {
  item: ChatQuote;
  index: number;
  onEdit: (item: ChatQuote) => void;
  onDelete: (item: ChatQuote) => void;
  render?: (item: ChatQuote) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      style={{ transform: CSS.Transform.toString(transform), transition }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: isDragging ? 0.6 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3",
        isDragging && "z-10 border-rose/40 shadow-[0_18px_40px_-18px_rgb(176_48_82/0.5)]",
      )}
    >
      {/* drag handle */}
      <button
        type="button"
        aria-label={`Reorder message ${index + 1}`}
        className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-inksoft/70 transition-colors hover:bg-rosemist hover:text-rose active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <span className="icon-[lucide--grip-vertical] size-4" />
      </button>

      <span className="w-6 shrink-0 text-center text-[12px] font-bold text-inksoft/60 tabular-nums">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        {render ? (
          render(item)
        ) : (
          <p className="wrap text-[15px] text-ink" data-multiline>
            {item.text}
          </p>
        )}
      </div>

      <button
        onClick={() => onEdit(item)}
        aria-label="Edit message"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-inksoft transition-colors hover:bg-rosemist hover:text-rose"
      >
        <span className="icon-[lucide--pencil] size-4" />
      </button>
      <button
        onClick={() => onDelete(item)}
        aria-label="Delete message"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-inksoft transition-colors hover:bg-rosemist hover:text-rosedeep"
      >
        <span className="icon-[lucide--trash-2] size-4" />
      </button>
    </motion.div>
  );
}
