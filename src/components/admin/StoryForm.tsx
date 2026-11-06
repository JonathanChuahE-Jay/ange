"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api, messageForCode } from "@/lib/api";
import type { Settings, SiteContent } from "@/lib/types";
import { TextField, TextArea } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { HEADING_SECTIONS, type Headings, type HeadingKey, type Heading } from "@/lib/headings";

const headingSchema = z.object({
  kicker: z.string().trim().max(80),
  title: z.string().trim().min(1, "Required").max(120),
  note: z.string().trim().max(160),
});

const schema = z.object({
  askerName: z.string().trim().min(1, "Required").max(60),
  partnerName: z.string().trim().min(1, "Required").max(60),
  question: z.string().trim().min(1, "Required").max(200),
  questionSubtext: z.string().trim().max(300),
  yesResponse: z.string().trim().min(1, "Required").max(400),
  noIsDodger: z.boolean(),
  anniversaryDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Pick a date"),
  countdownTitle: z.string().trim().min(1, "Required").max(120),
  countdownTarget: z.string(),
  letterTitle: z.string().trim().min(1, "Required").max(120),
  letterBody: z.string().trim().min(1, "Required").max(5000),
  letterSignoff: z.string().trim().min(1, "Required").max(60),
  footerText: z.string().trim().max(200),
  headings: z.record(z.string(), headingSchema),
});

type FormState = Omit<z.input<typeof schema>, "headings"> & { headings: Headings };

export function StoryForm() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const site = useQuery({
    queryKey: ["site"],
    queryFn: () => api.get<SiteContent>("/api/site"),
  });
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (site.data && !form) {
      const s: Settings = site.data.settings;
      setForm({
        askerName: s.askerName,
        partnerName: s.partnerName,
        question: s.question,
        questionSubtext: s.questionSubtext,
        yesResponse: s.yesResponse,
        noIsDodger: s.noIsDodger,
        anniversaryDate: s.anniversaryDate ?? "",
        countdownTitle: s.countdownTitle,
        countdownTarget: s.countdownTarget ?? "",
        letterTitle: s.letterTitle,
        letterBody: s.letterBody,
        letterSignoff: s.letterSignoff,
        footerText: s.footerText,
        headings: s.headings,
      });
    }
  }, [site.data, form]);

  const save = useMutation({
    mutationFn: (body: FormState) => api.send("/api/admin/settings", "PUT", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Saved");
    },
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
  });

  if (site.isPending || !form) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-12" />
        <div className="skeleton h-12" />
        <div className="skeleton h-12" />
      </div>
    );
  }

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  const setHeading = (section: HeadingKey, field: keyof Heading, value: string) =>
    setForm((f) =>
      f ? { ...f, headings: { ...f.headings, [section]: { ...f.headings[section], [field]: value } } } : f,
    );

  const submit = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) map[issue.path.map(String).join(".")] = issue.message;
      setErrors(map);
      return;
    }
    setErrors({});
    save.mutate(parsed.data as FormState);
  };

  const dtValue = (() => {
    if (!form.countdownTarget) return "";
    const d = new Date(form.countdownTarget);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <fieldset className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <legend className="px-2 font-display text-lg text-ink">The big question</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Your name" value={form.askerName} error={errors.askerName} onChange={(e) => set("askerName", e.target.value)} />
          <TextField label="Their name" value={form.partnerName} error={errors.partnerName} onChange={(e) => set("partnerName", e.target.value)} />
        </div>
        <div className="mt-4 flex flex-col gap-4">
          <TextField label="The question" value={form.question} error={errors.question} onChange={(e) => set("question", e.target.value)} />
          <TextField label="Little subtitle" value={form.questionSubtext} error={errors.questionSubtext} onChange={(e) => set("questionSubtext", e.target.value)} />
          <TextArea label="Shown when they tap Yes" value={form.yesResponse} error={errors.yesResponse} onChange={(e) => set("yesResponse", e.target.value)} />
          <div className="rounded-xl bg-rosemist/50 px-4 py-3">
            <Toggle
              checked={form.noIsDodger}
              onChange={(v) => set("noIsDodger", v)}
              label="The “No” button runs away (highly recommended)"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <legend className="px-2 font-display text-lg text-ink">Secret door</legend>
        <TextField
          label="Our first day together (unlocks the site)"
          type="date"
          value={form.anniversaryDate}
          error={errors.anniversaryDate}
          hint="Visitors must enter this date before they can see anything. Changing it re-locks every device. While it's empty the site stays locked for everyone except you (logged-in admin)."
          onChange={(e) => set("anniversaryDate", e.target.value)}
        />
      </fieldset>

      <fieldset className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <legend className="px-2 font-display text-lg text-ink">Countdown</legend>
        <div className="flex flex-col gap-4">
          <TextField label="Title" value={form.countdownTitle} error={errors.countdownTitle} onChange={(e) => set("countdownTitle", e.target.value)} />
          <TextField
            label="Target date & time"
            type="datetime-local"
            value={dtValue}
            hint="Leave empty for a “picking a date…” placeholder"
            onChange={(e) => set("countdownTarget", e.target.value ? new Date(e.target.value).toISOString() : "")}
          />
        </div>
      </fieldset>

      <fieldset className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <legend className="px-2 font-display text-lg text-ink">Love letter</legend>
        <div className="flex flex-col gap-4">
          <TextField label="Title" value={form.letterTitle} error={errors.letterTitle} onChange={(e) => set("letterTitle", e.target.value)} />
          <TextArea label="Letter body" rows={10} className="min-h-48" value={form.letterBody} error={errors.letterBody} onChange={(e) => set("letterBody", e.target.value)} />
          <TextField label="Sign-off" value={form.letterSignoff} error={errors.letterSignoff} onChange={(e) => set("letterSignoff", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <legend className="px-2 font-display text-lg text-ink">Footer</legend>
        <TextField
          label="Footer message"
          value={form.footerText}
          error={errors.footerText}
          hint="Shown at the very bottom of the page. Leave empty to hide it."
          onChange={(e) => set("footerText", e.target.value)}
        />
      </fieldset>

      <fieldset className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <legend className="px-2 font-display text-lg text-ink">Section titles &amp; subtitles (all sections)</legend>
        <p className="mb-4 text-sm text-inksoft">
          e.g. “freeze-framed feelings” / “Your photos” / “keep scrolling · tap one to relive it”. Leave the overline or subtitle empty to hide it.
        </p>
        <div className="flex flex-col gap-4">
          {HEADING_SECTIONS.map(({ key, label }) => {
            const h = form.headings[key];
            return (
              <div key={key} className="rounded-xl border border-line/70 bg-rosemist/20 p-3 sm:p-4">
                <p className="mb-3 text-sm font-bold text-ink">{label}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextField label="Overline (small text above)" value={h.kicker} error={errors[`headings.${key}.kicker`]} onChange={(e) => setHeading(key, "kicker", e.target.value)} />
                  <TextField label="Title" value={h.title} error={errors[`headings.${key}.title`]} onChange={(e) => setHeading(key, "title", e.target.value)} />
                  <TextField
                    label="Subtitle (handwritten, below)"
                    value={h.note}
                    error={errors[`headings.${key}.note`]}
                    hint={key === "games" ? "Empty = each game's own blurb" : undefined}
                    onChange={(e) => setHeading(key, "note", e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={save.isPending}
          className="tap-spring btn-circle-drop min-h-12 rounded-full bg-rose px-8 font-bold text-white hover:bg-rosedeep disabled:opacity-60"
        >
          {save.isPending ? "saving…" : "Save everything"}
        </button>
      </div>
    </form>
  );
}
