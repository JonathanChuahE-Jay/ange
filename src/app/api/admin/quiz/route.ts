import * as t from "@/lib/schema";
import { createHandler, listHandler } from "@/lib/resources";
import { quizBody, toRow } from "./schema";

const cfg = {
  table: t.quizQuestions,
  createSchema: quizBody,
  updateSchema: quizBody,
  invalidCode: "content.quiz.invalid" as const,
  notFoundCode: "content.quiz.not_found" as const,
  decorate: toRow,
};

export const GET = listHandler(cfg);
export const POST = createHandler(cfg);
