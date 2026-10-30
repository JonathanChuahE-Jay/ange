"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Mounts a WebGL scene only once it's near the viewport, tells it whether it
 * is visible (scenes pause their render loop off-screen), and silently drops
 * it if WebGL is missing or the scene throws — the page never breaks.
 */
export function LazyScene({
  className,
  children,
  rootMargin = "300px",
}: {
  className?: string;
  children: (active: boolean) => ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    if (!webglAvailable()) {
      setOk(false);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setMounted(true);
      },
      { rootMargin },
    );
    const visible = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    near.observe(el);
    visible.observe(el);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, [rootMargin]);

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none", className)}>
      {ok && mounted && <Boundary>{children(active)}</Boundary>}
    </div>
  );
}
