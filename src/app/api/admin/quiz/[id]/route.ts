import * as t from "@/lib/schema";
import { deleteHandler, updateHandler } from "@/lib/resources";
import { quizBody, toRow } from "../schema";

const cfg = {
  table: t.quizQuestions,
  createSchema: quizBody,
  updateSchema: quizBody,
  invalidCode: "content.quiz.invalid" as const,
  notFoundCode: "content.quiz.not_found" as const,
  decorate: toRow,
};

export const PUT = updateHandler(cfg);
export const DELETE = deleteHandler(cfg);
