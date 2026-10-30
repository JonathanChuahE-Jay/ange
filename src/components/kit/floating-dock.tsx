"use client";
/**
 * FloatingDock (Aceternity UI) — adapted for the love site: dusk-glass
 * palette, active-section highlight, mobile = compact scrollable bar instead
 * of the collapsible stack (one tap to jump anywhere).
 */

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

export type DockItem = { id: string; title: string; icon: string };

export const FloatingDock = ({
  items,
  active,
  hidden,
}: {
  items: DockItem[];
  active: string;
  hidden?: boolean;
}) => {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      initial={false}
      animate={{ y: hidden ? 90 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3"
      style={{ pointerEvents: hidden ? "none" : "auto" }}
    >
      {/* desktop: magnifying dock */}
      <nav
        aria-label="Sections"
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="hidden h-16 items-end gap-3 rounded-2xl border border-white/15 bg-dusk0/70 px-4 pb-3 shadow-[0_20px_50px_-15px_rgb(28_15_34/0.7)] backdrop-blur-xl md:flex"
      >
        {items.map((item) => (
          <IconContainer mouseX={mouseX} key={item.id} item={item} active={active === item.id} />
        ))}
      </nav>

      {/* mobile: compact bar */}
      <nav
        aria-label="Sections"
        className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/15 bg-dusk0/80 p-1.5 shadow-2xl backdrop-blur-xl md:hidden"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-label={item.title}
            aria-current={active === item.id ? "true" : undefined}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors duration-300",
              active === item.id && "bg-rose text-white shadow-[0_0_18px_rgb(214_69_96/0.6)]",
            )}
          >
            <span className={cn(item.icon, "size-[18px]")} aria-hidden />
          </a>
        ))}
      </nav>
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  item,
  active,
}: {
  mouseX: MotionValue<number>;
  item: DockItem;
  active: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const spring = { mass: 0.1, stiffness: 150, damping: 12 };
  const size = useSpring(useTransform(distance, [-150, 0, 150], [40, 72, 40]), spring);
  const iconSize = useSpring(useTransform(distance, [-150, 0, 150], [18, 32, 18]), spring);

  const [hovered, setHovered] = useState(false);

  return (
    <a href={`#${item.id}`} aria-label={item.title} aria-current={active ? "true" : undefined}>
      <motion.div
        ref={ref}
        style={{ width: size, height: size }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full transition-colors duration-300",
          active
            ? "bg-rose text-white shadow-[0_0_22px_rgb(214_69_96/0.65)]"
            : "bg-white/10 text-white/75 hover:bg-white/20",
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-9 left-1/2 w-fit rounded-md border border-white/15 bg-dusk0/90 px-2.5 py-1 text-xs font-semibold whitespace-pre text-white"
            >
              {item.title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.span style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
          <span className={cn(item.icon, "size-full")} aria-hidden />
        </motion.span>
      </motion.div>
    </a>
  );
}
