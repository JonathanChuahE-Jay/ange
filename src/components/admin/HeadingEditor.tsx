"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, messageForCode } from "@/lib/api";
import type { SiteContent } from "@/lib/types";
import { HEADING_SECTIONS, type Heading, type HeadingKey } from "@/lib/headings";
import { TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

/** Edit one section's heading on the public site: overline, title, note. */
export function HeadingEditor({ section }: { section: HeadingKey }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const site = useQuery({ queryKey: ["site"], queryFn: () => api.get<SiteContent>("/api/site") });
  const saved = site.data?.settings.headings[section];
  const [h, setH] = useState<Heading | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saved && !h) setH(saved);
  }, [saved, h]);

  const save = useMutation({
    mutationFn: (body: Heading) => api.send("/api/admin/headings", "PUT", { section, ...body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Heading saved");
    },
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
  });

  const label = HEADING_SECTIONS.find((s) => s.key === section)?.label ?? section;
  if (!h) return <div className="skeleton mb-6 h-36 rounded-2xl" />;

  const dirty = !saved || saved.kicker !== h.kicker || saved.title !== h.title || saved.note !== h.note;
  const set = (k: keyof Heading, v: string) => setH((x) => (x ? { ...x, [k]: v } : x));

  return (
    <form
      className="mb-6 rounded-2xl border border-line bg-white p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!h.title.trim()) return setError("Required");
        setError(null);
        save.mutate({ kicker: h.kicker.trim(), title: h.title.trim(), note: h.note.trim() });
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="icon-[lucide--heading] size-4 text-rose" aria-hidden />
        <p className="font-display text-lg text-ink">{label} heading on the site</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField label="Overline (small text above)" value={h.kicker} onChange={(e) => set("kicker", e.target.value)} />
        <TextField label="Title" value={h.title} error={error ?? undefined} onChange={(e) => set("title", e.target.value)} />
        <TextField
          label="Subtitle (handwritten, below)"
          value={h.note}
          hint={section === "games" ? "Empty = each game's own blurb" : undefined}
          onChange={(e) => set("note", e.target.value)}
        />
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        <p className="text-[13px] text-inksoft/70">Leave the overline or subtitle empty to hide it.</p>
        <button
          type="submit"
          disabled={save.isPending || !dirty}
          className="tap-spring min-h-10 rounded-full bg-rose px-5 text-sm font-bold text-white hover:bg-rosedeep disabled:opacity-50"
        >
          {save.isPending ? "saving…" : "Save heading"}
        </button>
      </div>
    </form>
  );
}
