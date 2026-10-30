"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "success" | "error" | "info";

type Toast = { id: number; kind: ToastKind; message: string };

const ToastCtx = createContext<{
  toast: (message: string, kind?: ToastKind) => void;
}>({ toast: () => {} });

export const useToast = () => useContext(ToastCtx);

const KIND_STYLES: Record<ToastKind, string> = {
  success: "bg-ink text-white",
  error: "bg-rosedeep text-white",
  info: "bg-white text-ink border border-line shadow-lg",
};

/** Global toast — spec: toasts/pop-in (scale 0.8→1 spring 500/22; exit 0.9+fade 150ms). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, message }]);
      window.setTimeout(() => remove(id), kind === "error" ? 6000 : 3500);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live={toasts.some((t) => t.kind === "error") ? "assertive" : "polite"}
        className="fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(3600);
  const start = useRef(performance.now());
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (paused) {
      if (timer.current) window.clearTimeout(timer.current);
      remaining.current -= performance.now() - start.current;
      return;
    }
    start.current = performance.now();
    timer.current = window.setTimeout(onDismiss, Math.max(200, remaining.current));
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [paused, onDismiss]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={
        toast.kind === "error"
          ? { duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }
          : { type: "spring", stiffness: 500, damping: 22 }
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role={toast.kind === "error" ? "alert" : "status"}
      className={`wrap pointer-events-auto flex min-h-11 max-w-[90vw] items-center gap-3 rounded-full px-5 py-3 text-sm font-medium shadow-xl ${KIND_STYLES[toast.kind]}`}
    >
      <span className="i-lucide-check-circle size-[18px] shrink-0 opacity-80" />
      <span>{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <span className="i-lucide-x size-4" />
      </button>
    </motion.div>
  );
}
