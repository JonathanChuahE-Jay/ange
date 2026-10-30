"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { z } from "zod";
import { api, messageForCode } from "@/lib/api";
import type { Paged } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EditorModal } from "./EditorModal";
import { useResource } from "./useResource";
import { TextField } from "@/components/ui/Field";

export type AdminTrack = {
  id: number;
  title: string;
  artist: string;
  note: string;
  mime: string;
  position: number;
  createdAt: string;
};

const metaSchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(120),
  artist: z.string().trim().max(120),
  note: z.string().trim().max(300),
});

export function MusicManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { list, remove } = useResource<AdminTrack>("tracks", "/api/admin/tracks");
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<AdminTrack | null>(null);
  const [form, setForm] = useState({ title: "", artist: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<AdminTrack | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name.replace(/\.[^.]+$/, ""));
      return api.upload("/api/admin/tracks", form);
    },
    onMutate: () => setUploading(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracks"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Song added");
    },
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
    onSettled: () => {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    },
  });

  const rename = useMutation({
    mutationFn: (body: { id: number; title: string; artist: string; note: string }) =>
      api.send("/api/admin/tracks", "PUT", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracks"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Saved");
      setEditing(null);
    },
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
  });

  const saveMeta = () => {
    const parsed = metaSchema.safeParse(form);
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) m[String(i.path[0])] = i.message;
      return setErrors(m);
    }
    setErrors({});
    if (editing)
      rename.mutate({ id: editing.id, ...parsed.data });
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">Music</h2>
          <p className="mt-0.5 text-[13px] text-inksoft">
            Uploaded songs play in the top bar on the love site
          </p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
          }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="tap-spring btn-circle-drop inline-flex min-h-10 items-center gap-2 rounded-full bg-rose px-5 text-sm font-bold text-white hover:bg-rosedeep disabled:opacity-60"
        >
          <span className="icon-[lucide--upload] size-4" />
          {uploading ? "uploading…" : "Upload song"}
        </button>
      </div>

      {list.isPending && (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {list.data && list.data.items.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-inksoft">
          No songs yet — upload an MP3 and it appears in the site's top music bar.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {list.data?.items.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm sm:flex-nowrap"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-goldsoft">
              <span className="icon-[lucide--music] size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{t.title}</p>
              <p className="truncate text-[13px] text-inksoft">{t.artist || "—"}</p>
            </div>
            <audio controls preload="none" src={`/api/tracks/${t.id}/raw`} className="h-8 max-w-45" />
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => {
                  setEditing(t);
                  setForm({ title: t.title, artist: t.artist, note: t.note });
                  setErrors({});
                }}
                aria-label="Edit details"
                className="flex size-10 items-center justify-center rounded-xl text-inksoft transition-colors hover:bg-rosemist hover:text-rose"
              >
                <span className="icon-[lucide--pencil] size-4.5" />
              </button>
              <button
                onClick={() => setDeleting(t)}
                aria-label="Delete song"
                className="flex size-10 items-center justify-center rounded-xl text-inksoft transition-colors hover:bg-rose-soft hover:text-rosedeep"
              >
                <span className="icon-[lucide--trash-2] size-4.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <EditorModal
        open={editing !== null}
        title="Song details"
        busy={rename.isPending}
        onClose={() => setEditing(null)}
        onSave={saveMeta}
      >
        <TextField
          label="Title"
          value={form.title}
          error={errors.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <TextField
          label="Artist"
          value={form.artist}
          error={errors.artist}
          onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
        />
        <TextField
          label="Note (optional)"
          value={form.note}
          error={errors.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />
      </EditorModal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this song?"
        message={`“${deleting?.title}” will be removed from the music bar.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
