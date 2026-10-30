"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatQuote } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Pixel-faithful WhatsApp for iPhone (light mode). The screen is laid out at
 * the real iPhone logical size (390×844pt) and scaled as one unit, so every
 * proportion — status bar, nav bar, bubbles, input bar — matches the app.
 * The conversation plays out live: "typing…" in the header for her messages,
 * your messages get typed into the input bar and sent, ticks go grey → blue.
 */

const W = 390;
const H = 844;
const IOS_BLUE = "#007AFF";
const TICK_BLUE = "#53BDEB";

type Tick = 1 | 2 | 3; // sent · delivered · read

// faint line-doodle wallpaper, like WhatsApp's default chat background
const DOODLE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' fill='none' stroke='#000' stroke-opacity='0.07' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>
    <path d='M30 34c-4-6-14-4-14 4 0 7 14 14 14 14s14-7 14-14c0-8-10-10-14-4z'/>
    <path d='M120 22l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z'/>
    <rect x='70' y='70' width='30' height='22' rx='6'/><path d='M78 92l-4 7 9-7'/>
    <circle cx='150' cy='95' r='9'/><path d='M150 86v-8M150 104v8M141 95h-8M159 95h8'/>
    <path d='M20 120v-18l14-3v18'/><circle cx='17' cy='120' r='3'/><circle cx='31' cy='117' r='3'/>
    <path d='M95 140c8-10 22-10 30 0M101 146c5-6 13-6 18 0'/><circle cx='110' cy='152' r='2'/>
    <path d='M150 150l12 8-12 8z'/><path d='M55 160h20M65 150v20'/>
  </svg>`.replace(/\s+/g, " "),
)}")`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function WhatsAppPhone({ chats, partnerName }: { chats: ChatQuote[]; partnerName: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);
  const inView = useInView(frameRef, { once: true, margin: "-120px" });

  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [ticks, setTicks] = useState<Record<number, Tick>>({});
  const [runId, setRunId] = useState(0);
  const [done, setDone] = useState(false);

  // scale the 390×844 screen to the frame width
  useLayoutEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W));
    ro.observe(el);
    setScale(el.clientWidth / W);
    return () => ro.disconnect();
  }, []);

  // play the conversation
  useEffect(() => {
    if (!inView || chats.length === 0) return;
    let alive = true;
    const markRead = () =>
      setTicks((t) => Object.fromEntries(Object.entries(t).map(([k]) => [k, 3 as Tick])));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(chats.length);
      setTicks(Object.fromEntries(chats.flatMap((c, i) => (c.side === "me" ? [[i, 3 as Tick]] : []))));
      setDone(true);
      return;
    }

    (async () => {
      setShown(0);
      setTicks({});
      setDone(false);
      await wait(700);
      for (let i = 0; i < chats.length && alive; i++) {
        const c = chats[i];
        if (c.side === "partner") {
          markRead(); // she opened the chat → your ticks turn blue
          setTyping(true);
          await wait(Math.min(2200, Math.max(900, 500 + c.text.length * 32)));
          if (!alive) return;
          setTyping(false);
          setShown(i + 1);
          await wait(650);
        } else {
          // you type it into the input bar, then send
          const step = Math.min(55, Math.max(18, 1100 / Math.max(1, c.text.length)));
          for (let k = 1; k <= c.text.length && alive; k++) {
            setDraft(c.text.slice(0, k));
            await wait(step);
          }
          await wait(280);
          if (!alive) return;
          setDraft("");
          setShown(i + 1);
          setTicks((t) => ({ ...t, [i]: 1 }));
          await wait(450);
          setTicks((t) => ({ ...t, [i]: 2 }));
          await wait(500);
        }
      }
      await wait(900);
      if (alive) {
        markRead();
        setDone(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [inView, chats, runId]);

  // keep the newest message in view, like the real app
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [shown, typing]);

  const replay = useCallback(() => {
    setDraft("");
    setTyping(false);
    setRunId((r) => r + 1);
  }, []);

  const visible = chats.slice(0, shown);
  const lastPartnerIdx = visible.reduce((acc, c, i) => (c.side === "partner" ? i : acc), -1);

  return (
    <div className="flex flex-col items-center">
      {/* iPhone frame (titanium edge + side buttons) */}
      <motion.div
        ref={frameRef}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[min(80vw,320px)] shrink-0 rounded-[3.1rem] bg-gradient-to-br from-[#3a3a3e] via-[#1f1f22] to-[#4b4b50] p-[10px] shadow-[0_50px_90px_-35px_rgb(28_15_34/0.75),inset_0_0_0_1.5px_rgb(255_255_255/0.12)]"
      >
        <span aria-hidden className="absolute top-[22%] -left-[3px] h-8 w-[3px] rounded-l bg-[#2a2a2d]" />
        <span aria-hidden className="absolute top-[30%] -left-[3px] h-14 w-[3px] rounded-l bg-[#2a2a2d]" />
        <span aria-hidden className="absolute top-[40%] -left-[3px] h-14 w-[3px] rounded-l bg-[#2a2a2d]" />
        <span aria-hidden className="absolute top-[32%] -right-[3px] h-20 w-[3px] rounded-r bg-[#2a2a2d]" />

        <div
          ref={screenRef}
          className="relative w-full overflow-hidden rounded-[2.45rem] bg-black"
          style={{ height: H * scale }}
          role="img"
          aria-label={`WhatsApp conversation with ${partnerName}`}
        >
          <div
            className="absolute top-0 left-0 whitespace-normal antialiased"
            style={{
              width: W,
              height: H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', var(--font-inter), sans-serif",
            }}
          >
            {/* ---------- wallpaper ---------- */}
            <div className="absolute inset-0 bg-[#EFEAE2]" style={{ backgroundImage: DOODLE, backgroundSize: "180px 180px" }} />

            {/* ---------- messages ---------- */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              className="no-scrollbar absolute inset-x-0 overflow-y-auto"
              style={{ top: 98, bottom: 84 }}
            >
              <div className="flex min-h-full flex-col justify-end px-[10px] pt-3 pb-2">
                <div className="mx-auto mb-2 rounded-[8px] bg-white/95 px-3 py-[5px] text-[12.5px] font-medium text-[#54656F] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)]">
                  Today
                </div>
                <div className="mx-auto mb-3 flex max-w-[86%] items-start gap-1.5 rounded-[8px] bg-[#FFEECD] px-3 py-[6px] text-center text-[12.5px] leading-[1.35] text-[#54656F] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)]">
                  <svg viewBox="0 0 10 12" className="mt-[3px] h-[11px] w-[9px] shrink-0" fill="#54656F">
                    <path d="M8.5 5H8V3.5a3 3 0 0 0-6 0V5h-.5A1.5 1.5 0 0 0 0 6.5v4A1.5 1.5 0 0 0 1.5 12h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 8.5 5ZM3.2 3.5a1.8 1.8 0 0 1 3.6 0V5H3.2Z" />
                  </svg>
                  <span className="whitespace-normal">Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.</span>
                </div>

                <AnimatePresence initial={false}>
                  {visible.map((c, i) => {
                    const me = c.side === "me";
                    const next = visible[i + 1];
                    const prev = visible[i - 1];
                    const lastOfGroup = !next || next.side !== c.side;
                    const firstOfGroup = !prev || prev.side !== c.side;
                    const reacted = i === lastPartnerIdx && done;
                    return (
                      <motion.div
                        key={c.id}
                        layout="position"
                        initial={{ opacity: 0, y: 14, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 520, damping: 34 }}
                        className={cn(
                          "flex w-full",
                          me ? "justify-end" : "justify-start",
                          firstOfGroup ? "mt-[8px]" : "mt-[2px]",
                          reacted && "mb-[18px]",
                        )}
                      >
                        <Bubble text={c.text} time={c.timeLabel} me={me} tail={lastOfGroup} tick={ticks[i]} reacted={reacted} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* ---------- status + nav bar (shared translucent bar) ---------- */}
            <div className="absolute inset-x-0 top-0 h-[98px] border-b-[0.5px] border-black/15 bg-[#F6F6F6]/95 backdrop-blur-xl">
              <StatusBar />
              <div className="absolute inset-x-0 top-[54px] flex h-[44px] items-center pr-[16px] pl-[6px]">
                <div className="flex items-center" style={{ color: IOS_BLUE }}>
                  <svg viewBox="0 0 12 20" className="h-[21px] w-[12px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2 2 10l8 8" />
                  </svg>
                  <span className="ml-[3px] text-[17px] leading-none">12</span>
                </div>
                <DefaultAvatar />
                <div className="ml-[10px] flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-[16.5px] font-semibold tracking-[-0.2px] text-black">{partnerName}</span>
                  <span className="truncate text-[12.5px] text-[#8E8E93]">
                    {typing ? "typing…" : shown > 0 || inView ? "online" : "tap here for contact info"}
                  </span>
                </div>
                <div className="flex items-center gap-[22px]" style={{ color: IOS_BLUE }}>
                  <svg viewBox="0 0 26 18" className="h-[17px] w-[25px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                    <rect x="1" y="2" width="16" height="14" rx="3.5" />
                    <path d="m17 7.2 6.3-3.6c.6-.3 1.2.1 1.2.8v9.2c0 .7-.6 1.1-1.2.8L17 10.8Z" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                    <path d="M6.6 2.8 4.3 3.4c-1 .3-1.6 1.3-1.4 2.3 1.6 7.7 7.7 13.8 15.4 15.4 1 .2 2-.4 2.3-1.4l.6-2.3c.2-.8-.2-1.6-.9-2l-3-1.5c-.7-.3-1.5-.2-2 .4l-1 1.2c-2.7-1.3-4.9-3.5-6.2-6.2l1.2-1c.6-.5.7-1.3.4-2l-1.5-3c-.4-.7-1.2-1.1-2-.9Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ---------- input bar ---------- */}
            <div className="absolute inset-x-0 bottom-0 h-[84px] border-t-[0.5px] border-black/15 bg-[#F6F6F6]/95 backdrop-blur-xl">
              <div className="flex h-[50px] items-center gap-[12px] px-[12px]" style={{ color: IOS_BLUE }}>
                <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <path d="M12 4v16M4 12h16" />
                </svg>
                <div className="flex h-[34px] min-w-0 flex-1 items-center rounded-full border-[0.5px] border-[#C8C8CC] bg-white pr-[8px] pl-[12px]">
                  <span className="min-w-0 flex-1 truncate text-[16px] text-black">
                    {draft}
                    {draft && <span className="ml-px inline-block h-[19px] w-[2px] translate-y-[3px] animate-pulse rounded-full" style={{ background: IOS_BLUE }} />}
                  </span>
                  {/* sticker */}
                  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                    <path d="M20 13.5V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h6.5Z" />
                    <path d="M13.5 20v-3.5a3 3 0 0 1 3-3H20" />
                    <circle cx="9.5" cy="10" r=".9" fill="currentColor" /><circle cx="14.5" cy="10" r=".9" fill="currentColor" />
                  </svg>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  {draft ? (
                    <motion.span
                      key="send"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full"
                      style={{ background: IOS_BLUE }}
                    >
                      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="#fff">
                        <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2Z" />
                      </svg>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="media"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex shrink-0 items-center gap-[18px]"
                    >
                      <svg viewBox="0 0 24 24" className="h-[25px] w-[25px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                        <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7l1.5-2h6.6l1.5 2h1.7A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z" />
                        <circle cx="12" cy="12.5" r="3.8" />
                      </svg>
                      <svg viewBox="0 0 24 24" className="h-[25px] w-[25px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                        <rect x="9" y="3" width="6" height="11" rx="3" />
                        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className="absolute bottom-[8px] left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black" />
            </div>

            {/* dynamic island */}
            <span className="absolute top-[11px] left-1/2 h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-black" />
          </div>
        </div>
      </motion.div>

      <button
        onClick={replay}
        disabled={!done}
        className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-inksoft transition-opacity hover:text-rose disabled:pointer-events-none disabled:opacity-0"
      >
        <span className="icon-[lucide--rotate-ccw] size-4" /> replay the chat
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function Bubble({
  text,
  time,
  me,
  tail,
  tick,
  reacted,
}: {
  text: string;
  time: string;
  me: boolean;
  tail: boolean;
  tick?: Tick;
  reacted: boolean;
}) {
  const bg = me ? "#D9FDD3" : "#FFFFFF";
  return (
    <div
      className={cn(
        "relative max-w-[78%] rounded-[18px] px-[10px] pt-[6px] pb-[7px] text-[16.5px] leading-[21px] tracking-[-0.2px] text-[#111B21] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)]",
        tail && (me ? "rounded-br-[4px]" : "rounded-bl-[4px]"),
      )}
      style={{ background: bg }}
    >
      <span className="whitespace-pre-wrap break-words">{text}</span>
      {/* invisible spacer reserves room for the meta, so text never runs under it */}
      <span aria-hidden className="invisible inline-block" style={{ width: me ? 74 : 56 }} />
      <span
        className="absolute right-[9px] bottom-[5px] flex items-center gap-[3px] text-[11px] leading-none"
        style={{ color: me ? "rgb(17 27 33 / 0.45)" : "#667781" }}
      >
        {time}
        {me && <Ticks state={tick ?? 1} />}
      </span>

      {tail && (
        <svg
          aria-hidden
          viewBox="0 0 11 17"
          className="absolute bottom-0 h-[17px] w-[11px]"
          style={me ? { right: -6, transform: "scaleX(-1)" } : { left: -6 }}
        >
          <path d="M11 0v17H1.5C.4 17-.1 15.7.7 15 4.9 11.4 9.4 6.6 11 0Z" fill={bg} />
        </svg>
      )}

      {reacted && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute -bottom-[17px] left-[8px] flex h-[24px] items-center rounded-full border-[1.5px] border-[#EFEAE2] bg-white px-[6px] shadow-[0_1px_2px_rgb(11_20_26/0.15)]"
        >
          <svg viewBox="0 0 24 22" className="h-[14px] w-[15px]">
            <path d="M12 21.6 10.3 20C4.2 14.6.2 11 .2 6.6.2 3 3 .2 6.6.2c2 0 4 1 5.4 2.5C13.4 1.2 15.4.2 17.4.2 21 .2 23.8 3 23.8 6.6c0 4.4-4 8-10.1 13.4Z" fill="#F2385A" />
          </svg>
        </motion.span>
      )}
    </div>
  );
}

function Ticks({ state }: { state: Tick }) {
  const color = state === 3 ? TICK_BLUE : "#8696A0";
  if (state === 1) {
    return (
      <svg viewBox="0 0 12 11" className="h-[11px] w-[12px]" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m1.5 6 3 3 6-7.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 17 11" className="h-[11px] w-[17px]" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m1 6 3 3 6-7.5M7.5 8.4l.6.6 6-7.5" />
    </svg>
  );
}

function DefaultAvatar() {
  return (
    <span className="ml-[8px] flex h-[36px] w-[36px] shrink-0 items-end justify-center overflow-hidden rounded-full bg-[#DFE5E7]">
      <svg viewBox="0 0 36 36" className="h-[36px] w-[36px]" fill="#FFFFFF">
        <circle cx="18" cy="14" r="7" />
        <path d="M4.5 33c1.6-7 7-10.5 13.5-10.5S29.9 26 31.5 33Z" />
      </svg>
    </span>
  );
}

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 flex h-[54px] items-center justify-between px-[30px] pt-[6px] text-black">
      <span className="w-[54px] text-center text-[17px] font-semibold tracking-[-0.3px]">9:41</span>
      <span className="flex items-center gap-[6px]">
        {/* signal */}
        <svg viewBox="0 0 18 12" className="h-[12px] w-[18px]" fill="#000">
          <rect x="0" y="8" width="3" height="4" rx=".8" />
          <rect x="5" y="5.5" width="3" height="6.5" rx=".8" />
          <rect x="10" y="3" width="3" height="9" rx=".8" />
          <rect x="15" y="0" width="3" height="12" rx=".8" />
        </svg>
        {/* wifi */}
        <svg viewBox="0 0 16 12" className="h-[12px] w-[16px]" fill="#000">
          <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.1-1.1A10 10 0 0 0 8 .8 10 10 0 0 0 .9 3.7L2 4.8a8.5 8.5 0 0 1 6-2.4Z" />
          <path d="M8 5.6c1.4 0 2.7.5 3.7 1.4l1.1-1.1A7 7 0 0 0 8 4a7 7 0 0 0-4.8 1.9L4.3 7A5.5 5.5 0 0 1 8 5.6Z" />
          <path d="M8 8.8c.6 0 1.1.2 1.5.6L8 11 6.5 9.4c.4-.4.9-.6 1.5-.6Z" />
        </svg>
        {/* battery */}
        <svg viewBox="0 0 27 13" className="h-[13px] w-[27px]">
          <rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#000" strokeOpacity=".35" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill="#000" />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="#000" fillOpacity=".4" />
        </svg>
      </span>
    </div>
  );
}
