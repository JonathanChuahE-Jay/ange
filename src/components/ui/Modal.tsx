"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** celebratory variant uses modals/bounce-in instead of modals/spring-pop */
  celebratory?: boolean;
  labelledBy?: string;
};

/**
 * Global modal — spec: modals/spring-pop (backdrop fade 200ms; panel .92→1
 * spring 500/32; exit 1→.96 faster) or modals/bounce-in when celebratory.
 */
export function Modal({ open, onClose, children, celebratory = false, labelledBy }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ?.focus();
    }, 50);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      window.clearTimeout(t);
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: celebratory ? 0.25 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={
              celebratory
                ? { scale: 0.3, opacity: 0 }
                : { scale: 0.92, opacity: 0 }
            }
            animate={
              celebratory
                ? { scale: [0.3, 1.08, 0.96, 1.02, 1], opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            exit={{ scale: celebratory ? 0.9 : 0.96, opacity: 0 }}
            transition={
              celebratory
                ? { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }
                : { type: "spring", stiffness: 500, damping: 32 }
            }
            className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            data-body=""
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
