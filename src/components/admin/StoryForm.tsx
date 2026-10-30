"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api, messageForCode } from "@/lib/api";
import type { Settings, SiteContent } from "@/lib/types";
import { TextField, TextArea } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";

const schema = z.object({
  askerName: z.string().trim().min(1, "Required").max(60),
  partnerName: z.string().trim().min(1, "Required").max(60),
  question: z.string().trim().min(1, "Required").max(200),
  questionSubtext: z.string().trim().max(300),
  yesResponse: z.string().trim().min(1, "Required").max(400),
  noIsDodger: z.boolean(),
  whatsappPhone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d\s-]*$/, "Digits, spaces, + and - only"),
  countdownTitle: z.string().trim().min(1, "Required").max(120),
  countdownTarget: z.string(),
  letterTitle: z.string().trim().min(1, "Required").max(120),
  letterBody: z.string().trim().min(1, "Required").max(5000),
  letterSignoff: z.string().trim().min(1, "Required").max(60),
});

type FormState = z.input<typeof schema>;

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
        whatsappPhone: s.whatsappPhone ?? "",
        countdownTitle: s.countdownTitle,
        countdownTarget: s.countdownTarget ?? "",
        letterTitle: s.letterTitle,
        letterBody: s.letterBody,
        letterSignoff: s.letterSignoff,
      });
    }
  }, [site.data, form]);

  const save = useMutation({
    mutationFn: (body: FormState) => api.send("/api/admin/settings", "PUT", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Saved 💖");
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

  const submit = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) map[String(issue.path[0])] = issue.message;
      setErrors(map);
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
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
      <fieldset className="rounded-2xl border border-line bg-white p-5">
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
          <TextField
            label="WhatsApp number (scan-to-reply QR)"
            placeholder="e.g. 60123456789"
            hint="International format, digits only — powers the QR next to the chat phone. Leave empty to hide it."
            value={form.whatsappPhone}
            error={errors.whatsappPhone}
            onChange={(e) => set("whatsappPhone", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-5">
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

      <fieldset className="rounded-2xl border border-line bg-white p-5">
        <legend className="px-2 font-display text-lg text-ink">Love letter</legend>
        <div className="flex flex-col gap-4">
          <TextField label="Title" value={form.letterTitle} error={errors.letterTitle} onChange={(e) => set("letterTitle", e.target.value)} />
          <TextArea label="Letter body" rows={10} className="min-h-48" value={form.letterBody} error={errors.letterBody} onChange={(e) => set("letterBody", e.target.value)} />
          <TextField label="Sign-off" value={form.letterSignoff} error={errors.letterSignoff} onChange={(e) => set("letterSignoff", e.target.value)} />
        </div>
      </fieldset>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={save.isPending}
          className="tap-spring btn-circle-drop min-h-12 rounded-full bg-rose px-8 font-bold text-white hover:bg-rosedeep disabled:opacity-60"
        >
          {save.isPending ? "saving…" : "Save everything 💖"}
        </button>
      </div>
    </form>
  );
}
