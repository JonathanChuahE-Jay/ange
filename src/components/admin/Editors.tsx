"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useResource } from "./useResource";
import { ResourceList } from "./ResourceList";
import { EditorModal } from "./EditorModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextArea, TextField } from "@/components/ui/Field";
import { ChatList } from "./ChatList";
import { api, messageForCode } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { ChatQuote, Love, Prize, TimelineEvent } from "@/lib/types";

type Draft = { id?: number };

/* ---------------- Timeline ---------------- */

const timelineSchema = z.object({
  date: z.string().trim().min(1, "When? e.g. “March 2024”").max(60),
  title: z.string().trim().min(1, "Give it a title").max(120),
  description: z.string().trim().max(1000),
  emoji: z.string().trim().max(8).default(""),
});
type TimelineForm = z.input<typeof timelineSchema>;

export function TimelineEditor() {
  const { list, create, update, remove } = useResource<TimelineEvent>("timeline", "/api/admin/timeline");
  const [draft, setDraft] = useState<(Draft & TimelineForm) | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<TimelineEvent | null>(null);

  const blank: TimelineForm = { date: "", title: "", description: "", emoji: "" };

  const save = () => {
    const parsed = timelineSchema.safeParse(draft);
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) m[String(i.path[0])] = i.message;
      return setErrors(m);
    }
    setErrors({});
    if (draft?.id) update.mutate({ id: draft.id, body: parsed.data });
    else create.mutate(parsed.data);
    setDraft(null);
  };

  return (
    <>
      <ResourceList
        title="Timeline"
        hint="Your story, chapter by chapter"
        items={list.data?.items}
        loading={list.isPending}
        onAdd={() => setDraft({ ...blank })}
        onEdit={(e) => setDraft({ id: e.id, date: e.date, title: e.title, description: e.description, emoji: e.emoji })}
        onDelete={setDeleting}
        render={(e) => (
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold tracking-wider text-gold uppercase">{e.date}</p>
              <p className="truncate font-semibold text-ink">{e.title}</p>
              <p className="wrap text-[13px] text-inksoft" data-multiline>{e.description}</p>
            </div>
          </div>
        )}
      />
      <EditorModal
        open={draft !== null}
        title={draft?.id ? "Edit moment" : "New moment"}
        busy={create.isPending || update.isPending}
        onClose={() => setDraft(null)}
        onSave={save}
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextField label="When" placeholder="e.g. March 2024" value={draft?.date ?? ""} error={errors.date} onChange={(e) => setDraft((d) => (d ? { ...d, date: e.target.value } : d))} />
          </div>
        </div>
        <TextField label="Title" value={draft?.title ?? ""} error={errors.title} onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))} />
        <TextArea label="The story (optional)" value={draft?.description ?? ""} error={errors.description} onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))} />
      </EditorModal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this moment?"
        message={`“${deleting?.title}” will be gone forever.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleting) remove.mutate(deleting.id); setDeleting(null); }}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

/* ---------------- Chats ---------------- */

const chatSchema = z.object({
  side: z.enum(["me", "partner"]),
  text: z.string().trim().min(1, "What did they say?").max(500),
  timeLabel: z.string().trim().max(20),
  delayMs: z.number().int().min(0, "0 ms or more").max(60_000),
});
type ChatForm = z.input<typeof chatSchema>;

export function ChatsEditor() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { list, create, update, remove } = useResource<ChatQuote>("chats", "/api/admin/chats");
  const [draft, setDraft] = useState<(Draft & ChatForm) | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<ChatQuote | null>(null);

  const reorder = useMutation({
    mutationFn: (ids: number[]) => api.send("/api/admin/chats/reorder", "PUT", { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
  });

  const save = () => {
    const parsed = chatSchema.safeParse(draft);
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) m[String(i.path[0])] = i.message;
      return setErrors(m);
    }
    setErrors({});
    if (draft?.id) update.mutate({ id: draft.id, body: parsed.data });
    else create.mutate(parsed.data);
    setDraft(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">Chat quotes</h2>
          <p className="mt-0.5 text-[13px] text-inksoft">
            Drag the handle to reorder — this is the order the messages play in the phone
          </p>
        </div>
        <button
          onClick={() => setDraft({ side: "me", text: "", timeLabel: "", delayMs: 900 })}
          className="tap-spring btn-circle-drop inline-flex min-h-10 items-center gap-2 rounded-full bg-rose px-5 text-sm font-bold text-white hover:bg-rosedeep"
        >
          <span className="icon-[lucide--plus] size-4" /> Add
        </button>
      </div>

      <ChatList
        items={list.data?.items}
        loading={list.isPending}
        onEdit={(c) =>
          setDraft({ id: c.id, side: c.side, text: c.text, timeLabel: c.timeLabel, delayMs: c.delayMs ?? 900 })
        }
        onDelete={setDeleting}
        onReorder={(ids) => reorder.mutate(ids)}
        render={(c) => (
          <div className={`flex flex-col ${c.side === "me" ? "items-end" : "items-start"}`}>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${c.side === "me" ? "bg-rose/10 text-rose" : "bg-goldsoft text-gold"}`}>
              {c.side === "me" ? "you" : "them"}
            </span>
            <p className="wrap mt-1 text-[15px] text-ink" data-multiline>{c.text}</p>
            <span className="mt-1 flex items-center gap-2 text-[11px] text-inksoft/70">
              {c.timeLabel && <span>{c.timeLabel}</span>}
              <span className="inline-flex items-center gap-1 rounded-full bg-rosemist px-2 py-0.5 font-semibold text-rose">
                <span className="icon-[lucide--timer] size-3" />
                {((c.delayMs ?? 900) / 1000).toFixed(1)}s delay
              </span>
            </span>
          </div>
        )}
      />
      <EditorModal
        open={draft !== null}
        title={draft?.id ? "Edit message" : "New message"}
        busy={create.isPending || update.isPending}
        onClose={() => setDraft(null)}
        onSave={save}
      >
        <div className="flex gap-2">
          {(["me", "partner"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setDraft((d) => (d ? { ...d, side } : d))}
              className={`min-h-10 flex-1 rounded-full text-sm font-bold transition-colors ${
                draft?.side === side ? "bg-rose text-white" : "bg-rosemist text-inksoft"
              }`}
            >
              {side === "me" ? "From you" : "From them"}
            </button>
          ))}
        </div>
        <TextArea label="Message" value={draft?.text ?? ""} error={errors.text} onChange={(e) => setDraft((d) => (d ? { ...d, text: e.target.value } : d))} />
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-inksoft" htmlFor="chat-delay">
            Wait before this message appears
          </label>
          <div className="flex items-center gap-3">
            <input
              id="chat-delay"
              type="range"
              min={0}
              max={8000}
              step={100}
              value={draft?.delayMs ?? 900}
              onChange={(e) => setDraft((d) => (d ? { ...d, delayMs: Number(e.target.value) } : d))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-rose"
            />
            <span className="w-16 text-right text-sm font-bold text-ink tabular-nums">
              {((draft?.delayMs ?? 900) / 1000).toFixed(1)}s
            </span>
          </div>
          <p className="text-[12px] text-inksoft/80">
            The pause after the previous message — 0s shows it instantly, longer makes the chat feel
            like a real conversation.
          </p>
        </div>
        <TextField label="Time label (optional)" placeholder="2:14 am" value={draft?.timeLabel ?? ""} error={errors.timeLabel} onChange={(e) => setDraft((d) => (d ? { ...d, timeLabel: e.target.value } : d))} />
      </EditorModal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this message?"
        message="This chat bubble will disappear from the phone."
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleting) remove.mutate(deleting.id); setDeleting(null); }}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

/* ---------------- Loves ---------------- */

const loveSchema = z.object({
  emoji: z.string().trim().max(8).default(""),
  text: z.string().trim().min(1, "What do you love?").max(120),
});
type LoveForm = z.input<typeof loveSchema>;

export function LovesEditor() {
  const { list, create, update, remove } = useResource<Love>("loves", "/api/admin/loves");
  const [draft, setDraft] = useState<(Draft & LoveForm) | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Love | null>(null);

  const save = () => {
    const parsed = loveSchema.safeParse(draft);
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) m[String(i.path[0])] = i.message;
      return setErrors(m);
    }
    setErrors({});
    if (draft?.id) update.mutate({ id: draft.id, body: parsed.data });
    else create.mutate(parsed.data);
    setDraft(null);
  };

  return (
    <>
      <ResourceList
        title="Things you love"
        hint="The little things that make you, you"
        items={list.data?.items}
        loading={list.isPending}
        onAdd={() => setDraft({ emoji: "", text: "" })}
        onEdit={(l) => setDraft({ id: l.id, emoji: l.emoji, text: l.text })}
        onDelete={setDeleting}
        render={(l) => (
          <div className="flex items-center gap-3">
            <p className="wrap font-semibold text-ink" data-multiline>{l.text}</p>
          </div>
        )}
      />
      <EditorModal
        open={draft !== null}
        title={draft?.id ? "Edit love" : "New love"}
        busy={create.isPending || update.isPending}
        onClose={() => setDraft(null)}
        onSave={save}
      >
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3">
            <TextField label="What is it?" value={draft?.text ?? ""} error={errors.text} onChange={(e) => setDraft((d) => (d ? { ...d, text: e.target.value } : d))} />
          </div>
        </div>
      </EditorModal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this love?"
        message={`“${deleting?.text}” will be removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleting) remove.mutate(deleting.id); setDeleting(null); }}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

/* ---------------- Prizes ---------------- */

const prizeSchema = z.object({
  label: z.string().trim().min(1, "Prize name").max(80),
  emoji: z.string().trim().max(8).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Hex color like #D64560"),
  weight: z.coerce.number().int().min(1).max(100),
});
type PrizeForm = z.input<typeof prizeSchema>;

const PRIZE_COLORS = ["#D64560", "#C9973F", "#B03052", "#E8879C", "#8E3B5E", "#D98E04"];

export function PrizesEditor() {
  const { list, create, update, remove } = useResource<Prize>("prizes", "/api/admin/prizes");
  const [draft, setDraft] = useState<(Draft & PrizeForm) | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Prize | null>(null);

  const save = () => {
    const parsed = prizeSchema.safeParse(draft);
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) m[String(i.path[0])] = i.message;
      return setErrors(m);
    }
    setErrors({});
    if (draft?.id) update.mutate({ id: draft.id, body: parsed.data });
    else create.mutate(parsed.data);
    setDraft(null);
  };

  return (
    <>
      <ResourceList
        title="Prize wheel"
        hint="Weight = how likely it is (1–100). 6–8 prizes look best."
        items={list.data?.items}
        loading={list.isPending}
        onAdd={() => setDraft({ label: "", emoji: "", color: PRIZE_COLORS[0], weight: 1 })}
        onEdit={(p) => setDraft({ id: p.id, label: p.label, emoji: p.emoji, color: p.color, weight: p.weight })}
        onDelete={setDeleting}
        render={(p) => (
          <div className="flex items-center gap-3">
            <span className="size-5 shrink-0 rounded-full ring-2 ring-white" style={{ background: p.color }} aria-hidden />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{p.label}</p>
              <p className="text-[13px] text-inksoft">weight {p.weight}</p>
            </div>
          </div>
        )}
      />
      <EditorModal
        open={draft !== null}
        title={draft?.id ? "Edit prize" : "New prize"}
        busy={create.isPending || update.isPending}
        onClose={() => setDraft(null)}
        onSave={save}
      >
        <div>
          <div>
            <TextField label="Prize" placeholder="Dinner date" value={draft?.label ?? ""} error={errors.label} onChange={(e) => setDraft((d) => (d ? { ...d, label: e.target.value } : d))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Weight (1–100)" type="number" min={1} max={100} value={String(draft?.weight ?? 1)} error={errors.weight} onChange={(e) => setDraft((d) => (d ? { ...d, weight: e.target.value === "" ? 1 : Number(e.target.value) } : d))} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-inksoft">Colour</span>
            <div className="flex min-h-11 items-center gap-2">
              {PRIZE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Use colour ${c}`}
                  onClick={() => setDraft((d) => (d ? { ...d, color: c } : d))}
                  className={`size-8 rounded-full transition-transform hover:scale-110 ${draft?.color === c ? "ring-[3px] ring-ink/60 ring-offset-2" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </EditorModal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this prize?"
        message={`“${deleting?.label}” will be removed from the wheel.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleting) remove.mutate(deleting.id); setDeleting(null); }}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
