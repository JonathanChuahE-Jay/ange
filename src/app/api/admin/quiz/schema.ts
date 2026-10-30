import { z } from "zod";

/** Shared body schema: options arrive as an array, are stored as JSON text. */
export const quizBody = z
  .object({
    question: z.string().trim().min(1).max(200),
    options: z.array(z.string().trim().min(1).max(80)).min(2).max(4),
    answerIndex: z.number().int().min(0).max(3),
  })
  .refine((v) => v.answerIndex < v.options.length, { message: "answer must be one of the options", path: ["answerIndex"] });

export const toRow = (v: Record<string, unknown>) => ({
  ...v,
  ...(Array.isArray(v.options) ? { options: JSON.stringify(v.options) } : {}),
});
