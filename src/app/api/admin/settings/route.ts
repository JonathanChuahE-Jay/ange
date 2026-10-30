import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import { route } from "@/lib/handlers";

const bodySchema = z.object({
  askerName: z.string().trim().min(1).max(60),
  partnerName: z.string().trim().min(1).max(60),
  question: z.string().trim().min(1).max(200),
  questionSubtext: z.string().trim().max(300),
  yesResponse: z.string().trim().min(1).max(400),
  noIsDodger: z.boolean(),
  whatsappPhone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d\s-]*$/, "digits, spaces, + and - only"),
  anniversaryDate: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "use YYYY-MM-DD")
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "invalid date"),
  countdownTitle: z.string().trim().min(1).max(120),
  countdownTarget: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "invalid date"),
  letterTitle: z.string().trim().min(1).max(120),
  letterBody: z.string().trim().min(1).max(5000),
  letterSignoff: z.string().trim().min(1).max(60),
});

export async function PUT(req: Request) {
  return route(async () => {
    await requireAuth();
    ensureSeed();
    const body = bodySchema.parse(await req.json());
    db.update(t.settings)
      .set({
        askerName: body.askerName,
        partnerName: body.partnerName,
        question: body.question,
        questionSubtext: body.questionSubtext,
        yesResponse: body.yesResponse,
        noIsDodger: body.noIsDodger ? 1 : 0,
        whatsappPhone: body.whatsappPhone,
        anniversaryDate: body.anniversaryDate,
        countdownTitle: body.countdownTitle,
        countdownTarget: body.countdownTarget,
        letterTitle: body.letterTitle,
        letterBody: body.letterBody,
        letterSignoff: body.letterSignoff,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(t.settings.id, 1))
      .run();
    return Response.json({ ok: true });
  });
}
