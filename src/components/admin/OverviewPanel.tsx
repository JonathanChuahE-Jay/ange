"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, messageForCode } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

type Overview = {
  latestAnswer: { answer: string; at: string } | null;
  yesAt: string | null;
  counts: Record<string, number>;
};

export function OverviewPanel() {
  const { data, isPending } = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<Overview>("/api/admin/overview"),
  });
  const qc = useQueryClient();
  const { toast } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const reset = useMutation({
    mutationFn: () => api.send("/api/admin/answers", "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Question re-armed — she'll see Yes / No again");
    },
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
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
    { label: "Timeline moments", value: data.counts.timeline, icon: "icon-[lucide--milestone]" },
    { label: "Photos", value: data.counts.photos, icon: "icon-[lucide--image]" },
    { label: "Chat quotes", value: data.counts.chats, icon: "icon-[lucide--message-circle]" },
    { label: "Loves", value: data.counts.loves, icon: "icon-[lucide--sparkles]" },
    { label: "Songs", value: data.counts.tracks, icon: "icon-[lucide--music]" },
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
            <p className="mt-2 font-display text-4xl">She said YES</p>
            <p className="mt-2 text-sm opacity-80">
              {new Date(data.yesAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}
            </p>
          </>
        ) : data.latestAnswer ? (
          <p className="mt-2 font-display text-3xl">
            Latest answer: “{data.latestAnswer.answer}” — {new Date(data.latestAnswer.at).toLocaleString()}
          </p>
        ) : (
          <p className="mt-2 font-display text-2xl">No answer yet — the suspense!</p>
        )}
        {data.latestAnswer && (
          <button
            onClick={() => setConfirmReset(true)}
            disabled={reset.isPending}
            className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-sm font-bold transition-colors disabled:opacity-60 ${
              data.yesAt ? "bg-white/15 text-white hover:bg-white/25" : "bg-rosemist text-rose hover:bg-rosesoft"
            }`}
          >
            <span className="icon-[lucide--rotate-ccw] size-4" />
            {reset.isPending ? "resetting…" : "Reset answer"}
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirmReset}
        title="Reset the answer?"
        message="This clears the recorded answer so the Yes / No question shows again on the site. Use it to re-arm the surprise after testing."
        confirmLabel="Reset"
        danger
        onConfirm={() => {
          reset.mutate();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />

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
    </div>
  );
}
