"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import BlurText from "@/components/kit/BlurText";
import { Meteors } from "@/components/kit/meteors";
import { BorderBeam } from "@/components/kit/border-beam";
import { ShimmerButton } from "@/components/kit/shimmer-button";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { LazyScene } from "@/components/three/LazyScene";
import { CustomCursor } from "./CustomCursor";

const HeartMascotScene = dynamic(() => import("@/components/three/HeartMascotScene"), { ssr: false });

type Field = "d" | "m" | "y";
const MAX: Record<Field, number> = { d: 2, m: 2, y: 4 };
const PH: Record<Field, string> = { d: "DD", m: "MM", y: "YYYY" };

/** The secret door: enter our first day together to unlock the site. */
export function DateGate() {
  const router = useRouter();
  const [val, setVal] = useState<Record<Field, string>>({ d: "", m: "", y: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState(false);
  const [sad, setSad] = useState(false);
  const mascotRef = useRef<HTMLDivElement>(null);
  const doorRef = useRef<HTMLDivElement>(null);
  const [doorH, setDoorH] = useState<number | undefined>(undefined);
  const refs = { d: useRef<HTMLInputElement>(null), m: useRef<HTMLInputElement>(null), y: useRef<HTMLInputElement>(null) };
  const [scope, animate] = useAnimate();

  const order: Field[] = ["d", "m", "y"];

  const onChange = (f: Field, raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, MAX[f]);
    setVal((s) => ({ ...s, [f]: v }));
    setError(null);
    if (v.length === MAX[f]) {
      const next = order[order.indexOf(f) + 1];
      if (next) refs[next].current?.focus();
    }
  };

  const onKeyDown = (f: Field, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && val[f] === "") {
      const prev = order[order.indexOf(f) - 1];
      if (prev) refs[prev].current?.focus();
    }
  };

  const complete = val.d.length >= 1 && val.m.length >= 1 && val.y.length === 4;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete || busy) return;
    const date = `${val.y}-${val.m.padStart(2, "0")}-${val.d.padStart(2, "0")}`;
    setBusy(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (res.ok) {
        // keep the same card height so nothing jumps when "Welcome home" swaps in
        setDoorH(doorRef.current?.offsetHeight);
        setOpened(true);
        window.setTimeout(() => router.refresh(), 1600);
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(body?.error?.message ?? "That's not our day. Try again.");
      setSad(true);
      window.setTimeout(() => setSad(false), 1600);
      void animate(scope.current, { x: [0, -12, 12, -8, 8, -4, 0] }, { duration: 0.45 });
    } catch {
      setError("Couldn't reach the door. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(120%_90%_at_50%_110%,#B34A5E_0%,#6E2748_38%,#3A1533_68%,#1C0F22_100%)] px-5">
      <div aria-hidden className="stars-layer absolute inset-0 opacity-60" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Meteors number={16} className="bg-rosesoft" />
      </div>
      <div aria-hidden className="absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose/20 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-36 w-full max-w-md"
      >
        {/* heart mascot peeking over the card; its eyes follow the cursor */}
        <div
          ref={mascotRef}
          aria-hidden
          className="pointer-events-none absolute bottom-full left-1/2 z-0 -mb-[70px] h-[240px] w-[300px] -translate-x-1/2"
        >
          <LazyScene className="absolute inset-0" rootMargin="0px">
            {(active) => (
              <HeartMascotScene
                active={active}
                hostRef={mascotRef}
                mood={opened ? "happy" : sad ? "error" : busy ? "busy" : "idle"}
              />
            )}
          </LazyScene>
        </div>
        {/* paws resting on the card edge (in front of the glass) */}
        {[-1, 1].map((side) => (
          <span
            key={side}
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 z-20 h-6 w-10 -translate-y-[45%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFC1CF_0%,#F27C93_45%,#C9506B_100%)] shadow-[0_4px_10px_-2px_rgb(67_38_58/0.55)]"
            style={{ marginLeft: side * 52 - 20 }}
          >
            <span className="absolute top-1 left-2.5 h-1.5 w-1 rounded-full bg-white/40" />
            <span className="absolute top-1 left-4.5 h-1.5 w-1 rounded-full bg-white/40" />
            <span className="absolute top-1 left-6.5 h-1.5 w-1 rounded-full bg-white/40" />
          </span>
        ))}

      <AnimatePresence mode="wait" initial={false}>
        {!opened ? (
          <motion.div
            ref={doorRef}
            key="door"
            exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] px-7 pt-12 pb-10 text-center shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] backdrop-blur-xl md:px-10"
          >
            <BorderBeam size={160} duration={9} colorFrom="#D64560" colorTo="#F3E3C3" />

            <p className="text-[12px] font-bold tracking-[0.35em] text-goldsoft/85 uppercase">a secret door</p>
            <BlurText
              as="h1"
              text="When did we become us?"
              trigger="load"
              animateBy="words"
              direction="top"
              delay={110}
              className="wrap mt-3 justify-center font-display text-[2.1rem] leading-tight text-white md:text-[2.5rem]"
            />
            <p className="mt-3 font-hand text-2xl text-white/65">the day it all started</p>

            <form onSubmit={submit} className="mt-8 flex flex-col items-center gap-6">
              <div ref={scope} className="flex items-end justify-center gap-2.5">
                {order.map((f, i) => (
                  <div key={f} className="flex items-end gap-2.5">
                    <label className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold tracking-[0.25em] text-white/45 uppercase">
                        {f === "d" ? "day" : f === "m" ? "month" : "year"}
                      </span>
                      <input
                        ref={refs[f]}
                        inputMode="numeric"
                        autoComplete="off"
                        autoFocus={f === "d"}
                        aria-label={f === "d" ? "Day" : f === "m" ? "Month" : "Year"}
                        placeholder={PH[f]}
                        value={val[f]}
                        onChange={(e) => onChange(f, e.target.value)}
                        onKeyDown={(e) => onKeyDown(f, e)}
                        className={cn(
                          "h-15 rounded-2xl border bg-white/10 text-center font-display text-2xl text-white placeholder:text-white/25 outline-none transition-[border-color,box-shadow] duration-200 focus:border-rosesoft focus:shadow-[0_0_0_4px_rgb(214_69_96/0.3)]",
                          f === "y" ? "w-24" : "w-16",
                          error ? "border-rose" : "border-white/20",
                        )}
                      />
                    </label>
                    {i < 2 && <span className="pb-3 font-display text-2xl text-white/30">/</span>}
                  </div>
                ))}
              </div>

              <div className="min-h-5">
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      role="alert"
                      className="text-sm font-semibold text-rosesoft"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <ShimmerButton
                type="submit"
                disabled={!complete || busy}
                background="linear-gradient(135deg, #E25A74 0%, #D64560 45%, #B03052 100%)"
                shimmerColor="#FFE3EA"
                className="min-h-13 px-10 text-base font-bold shadow-[0_0_40px_rgb(214_69_96/0.45)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {busy ? "checking…" : "Open the door"}
                  <span className="icon-[lucide--arrow-right] size-4.5" />
                </span>
              </ShimmerButton>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ minHeight: doorH }}
            className="relative z-10 flex w-full flex-col items-center justify-center rounded-[2rem] border border-white/15 bg-white/[0.06] px-7 pt-20 pb-12 text-center backdrop-blur-xl"
          >
            <p className="font-display text-4xl text-white">Welcome home</p>
            <p className="mt-2 font-hand text-2xl text-white/65">I&apos;ve been waiting for you</p>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
      <CustomCursor />
    </main>
  );
}
