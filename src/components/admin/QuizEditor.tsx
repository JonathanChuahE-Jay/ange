"use client";

import { useState } from "react";
import { z } from "zod";
import { useResource } from "./useResource";
import { ResourceList } from "./ResourceList";
import { EditorModal } from "./EditorModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/Field";

/** Row as stored (options is JSON text). */
type QuizRow = { id: number; question: string; options: string; answerIndex: number };

const schema = z
  .object({
    question: z.string().trim().min(1, "Ask something").max(200),
    options: z.array(z.string().trim().max(80)).length(4),
    answerIndex: z.number().int().min(0).max(3),
  })
  .transform((v) => {
    // keep the filled options, remap the correct answer to its new index
    const filled = v.options.map((o, i) => ({ o, i })).filter((x) => x.o.length > 0);
    return {
      question: v.question,
      options: filled.map((x) => x.o),
      answerIndex: Math.max(0, filled.findIndex((x) => x.i === v.answerIndex)),
      _ok: filled.length >= 2 && filled.some((x) => x.i === v.answerIndex),
    };
  });

type Draft = { id?: number; question: string; options: string[]; answerIndex: number };

const parseOptions = (raw: string): string[] => {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};

const LETTERS = ["A", "B", "C", "D"];

export function QuizEditor() {
  const { list, create, update, remove } = useResource<QuizRow>("quiz", "/api/admin/quiz");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<QuizRow | null>(null);

  const save = () => {
    if (!draft) return;
    const parsed = schema.safeParse(draft);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the question");
    if (!parsed.data._ok) return setError("Fill at least 2 options and mark a filled one as correct");
    setError(null);
    const { _ok: _, ...body } = parsed.data;
    if (draft.id) update.mutate({ id: draft.id, body });
    else create.mutate(body);
    setDraft(null);
  };

  const setOption = (i: number, v: string) =>
    setDraft((d) => (d ? { ...d, options: d.options.map((o, k) => (k === i ? v : o)) } : d));

  return (
    <>
      <ResourceList
        title="How well do you know us?"
        hint="Quiz questions for the Games section — mark the right answer for each"
        items={list.data?.items}
        loading={list.isPending}
        onAdd={() => setDraft({ question: "", options: ["", "", "", ""], answerIndex: 0 })}
        onEdit={(q) => {
          const opts = parseOptions(q.options);
          setDraft({
            id: q.id,
            question: q.question,
            options: [...opts, "", "", "", ""].slice(0, 4),
            answerIndex: q.answerIndex,
          });
        }}
        onDelete={setDeleting}
        render={(q) => {
          const opts = parseOptions(q.options);
          return (
            <div className="flex flex-col gap-1.5">
              <p className="wrap font-semibold text-ink" data-multiline>{q.question}</p>
              <div className="flex flex-wrap gap-1.5">
                {opts.map((o, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                      i === q.answerIndex ? "bg-rose text-white" : "bg-rosemist text-inksoft"
                    }`}
                  >
                    {o}
                  </span>
                ))}
              </div>
            </div>
          );
        }}
      />
      <EditorModal
        open={draft !== null}
        title={draft?.id ? "Edit question" : "New question"}
        busy={create.isPending || update.isPending}
        onClose={() => setDraft(null)}
        onSave={save}
      >
        <div className="flex flex-col gap-4">
          <TextField
            label="Question"
            value={draft?.question ?? ""}
            onChange={(e) => setDraft((d) => (d ? { ...d, question: e.target.value } : d))}
          />
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-inksoft">Options — tap the circle to mark the correct one</p>
            {draft?.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft((d) => (d ? { ...d, answerIndex: i } : d))}
                  aria-label={`Mark option ${LETTERS[i]} correct`}
                  aria-pressed={draft.answerIndex === i}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                    draft.answerIndex === i ? "border-rose bg-rose text-white" : "border-line text-inksoft hover:border-rose/60"
                  }`}
                >
                  {draft.answerIndex === i ? <span className="icon-[lucide--check] size-4" /> : LETTERS[i]}
                </button>
                <input
                  value={o}
                  placeholder={i < 2 ? `Option ${LETTERS[i]}` : `Option ${LETTERS[i]} (optional)`}
                  onChange={(e) => setOption(i, e.target.value)}
                  className="input-ring min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-sm font-semibold text-rosedeep">{error}</p>}
        </div>
      </EditorModal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this question?"
        message={`“${deleting?.question}” will be removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleting) remove.mutate(deleting.id); setDeleting(null); }}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
