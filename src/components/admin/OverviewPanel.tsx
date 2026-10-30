"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Overview = {
  latestAnswer: { answer: string; at: string } | null;
  yesAt: string | null;
  prizeWins: { id: number; prizeLabel: string; at: string }[];
  counts: Record<string, number>;
};

export function OverviewPanel() {
  const { data, isPending } = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<Overview>("/api/admin/overview"),
  });

  if (isPending || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Timeline moments", value: data.counts.timeline, icon: "i-lucide-milestone" },
    { label: "Photos", value: data.counts.photos, icon: "i-lucide-image" },
    { label: "Chat quotes", value: data.counts.chats, icon: "i-lucide-message-circle" },
    { label: "Loves", value: data.counts.loves, icon: "i-lucide-sparkles" },
    { label: "Songs", value: data.counts.tracks, icon: "i-lucide-music" },
    { label: "Prizes", value: data.counts.prizes, icon: "i-lucide-gift" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* the answer */}
      <div
        className={`rounded-3xl p-6 text-center shadow-lg ${
          data.yesAt
            ? "bg-gradient-to-br from-rose to-rosedeep text-white"
            : "border border-dashed border-line bg-white text-inksoft"
        }`}
      >
        <p className="text-[13px] font-bold tracking-widest uppercase opacity-70">the answer</p>
        {data.yesAt ? (
          <>
            <p className="mt-2 font-display text-4xl">She said YES 💖</p>
            <p className="mt-2 text-sm opacity-80">
              {new Date(data.yesAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}
            </p>
          </>
        ) : data.latestAnswer ? (
          <p className="mt-2 font-display text-3xl">
            Latest answer: “{data.latestAnswer.answer}” — {new Date(data.latestAnswer.at).toLocaleString()}
          </p>
        ) : (
          <p className="mt-2 font-display text-2xl">No answer yet — the suspense! 🥺</p>
        )}
      </div>

      {/* counts */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-white p-5">
            <span className={`${c.icon} size-5 text-rose`} />
            <p className="mt-3 font-display text-3xl text-ink">{c.value}</p>
            <p className="text-[13px] text-inksoft">{c.label}</p>
          </div>
        ))}
      </div>

      {/* prize wins */}
      <div>
        <h2 className="font-display text-2xl text-ink">Wheel spins</h2>
        {data.prizeWins.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line bg-white px-5 py-6 text-center text-sm text-inksoft">
            No spins yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {data.prizeWins.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm"
              >
                <span className="font-semibold text-ink">{w.prizeLabel}</span>
                <span className="text-inksoft">
                  {new Date(w.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
