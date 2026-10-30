"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { celebrate } from "./celebrate";

const LETTERS = ["A", "B", "C", "D"];

/** How well do you know us? — admin-authored multiple-choice quiz. */
export function LoveQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-white/70 px-8 py-12 text-center">
        <span className="icon-[lucide--circle-help] size-8 text-rose/60" />
        <p className="text-inksoft">No quiz questions yet. Add some in the admin panel.</p>
      </div>
    );
  }

  const q = questions[i];
  const total = questions.length;

  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const right = k === q.answerIndex;
    if (right) setScore((s) => s + 1);
    window.setTimeout(() => {
      if (i + 1 < total) {
        setI(i + 1);
        setPicked(null);
      } else {
        setDone(true);
        if (score + (right ? 1 : 0) >= Math.ceil(total * 0.75)) celebrate();
      }
    }, 1100);
  };

  const restart = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  const pct = score / total;
  const verdict =
    pct === 1 ? "You know us by heart" : pct >= 0.75 ? "Practically my other half" : pct >= 0.5 ? "Not bad, but we need more dates" : "Okay… date night. Tonight.";

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* progress */}
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-bold tracking-[0.2em] text-inksoft/70 tabular-nums">
          {String(Math.min(i + 1, total)).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose to-gold"
            animate={{ width: `${((done ? total : i) / total) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <span className="flex items-center gap-1 text-sm font-semibold text-inksoft">
          <span className="icon-[lucide--heart] size-4 text-rose" />{score}
        </span>
      </div>

      <div className="relative mt-6 min-h-[22rem]">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 30, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -30, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="wrap text-center font-display text-2xl leading-snug text-ink md:text-3xl">{q.question}</h3>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {q.options.map((o, k) => {
                  const isRight = picked !== null && k === q.answerIndex;
                  const isWrong = picked === k && k !== q.answerIndex;
                  return (
                    <motion.button
                      key={k}
                      onClick={() => choose(k)}
                      disabled={picked !== null}
                      animate={isWrong ? { x: [0, -8, 8, -5, 5, 0] } : isRight ? { scale: [1, 1.04, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "flex min-h-15 items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 text-left font-semibold text-ink shadow-[0_8px_20px_-14px_rgb(176_48_82/0.5)] transition-colors duration-200",
                        picked === null && "border-line hover:border-rose/60 hover:bg-rosemist/40",
                        isRight && "border-emerald-500 bg-emerald-50",
                        isWrong && "border-rose bg-rosemist",
                        picked !== null && !isRight && !isWrong && "border-line opacity-55",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          isRight ? "bg-emerald-500 text-white" : isWrong ? "bg-rose text-white" : "bg-rosemist text-rose",
                        )}
                      >
                        {isRight ? <span className="icon-[lucide--check] size-4" /> : isWrong ? <span className="icon-[lucide--x] size-4" /> : LETTERS[k]}
                      </span>
                      <span className="wrap" data-multiline>{o}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center pt-4 text-center"
            >
              <div className="relative flex size-36 items-center justify-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#F0DCE0" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="44" fill="none" stroke="url(#qg)" strokeWidth="8" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: pct }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <defs>
                    <linearGradient id="qg" x1="0" x2="1">
                      <stop offset="0" stopColor="#D64560" />
                      <stop offset="1" stopColor="#C9973F" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="font-display text-4xl text-ink">
                  {score}<span className="text-xl text-inksoft">/{total}</span>
                </span>
              </div>
              <p className="mt-5 font-display text-3xl text-ink">{verdict}</p>
              <button
                onClick={restart}
                className="mt-6 flex min-h-11 items-center gap-2 rounded-full bg-rose px-6 font-bold text-white transition-colors hover:bg-rosedeep"
              >
                <span className="icon-[lucide--rotate-ccw] size-4" /> Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
