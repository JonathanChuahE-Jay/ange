/* Generic CRUD factory for admin content entities.
 * Keeps list (paginated) / create / update / delete consistent across resources.
 */
import { asc, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import { db, ensureSeed } from "./db";
import { ApiError, type ErrorCode } from "./errors";
import { requireAuth } from "./auth";
import { paged, parsePage, route, type PageParams } from "./handlers";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Cfg = {
  table: any;
  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
  invalidCode: ErrorCode;
  notFoundCode: ErrorCode;
  /** optional per-entity tweak of parsed values before insert */
  decorate?: (values: Record<string, unknown>) => Record<string, unknown>;
};

function nextPosition(table: any): number {
  const row = db.select({ v: sql<number>`COALESCE(MAX(${table.position}), -1) + 1` }).from(table).all()[0];
  return Number(row?.v ?? 0);
}

export function listHandler(cfg: Cfg) {
  return async function GET(req: Request) {
    return route(async () => {
      await requireAuth();
      ensureSeed();
      const url = new URL(req.url);
      const p: PageParams = parsePage(url);
      const items = db
        .select()
        .from(cfg.table)
        .orderBy(asc(cfg.table.position), asc(cfg.table.id))
        .limit(p.pageSize)
        .offset((p.page - 1) * p.pageSize)
        .all();
      const total = db.select({ v: sql<number>`COUNT(*)` }).from(cfg.table).all()[0];
      return Response.json(paged(items, Number(total?.v ?? 0), p));
    });
  };
}

export function createHandler(cfg: Cfg) {
  return async function POST(req: Request) {
    return route(async () => {
      await requireAuth();
      ensureSeed();
      const parsed = cfg.createSchema.parse(await req.json()) as Record<string, unknown>;
      const values = { ...parsed, position: nextPosition(cfg.table), createdAt: new Date().toISOString() };
      const final = cfg.decorate ? cfg.decorate(values) : values;
      const inserted = db.insert(cfg.table).values(final).returning().all() as unknown[];
      return Response.json(inserted[0], { status: 201 });
    });
  };
}

export function updateHandler(cfg: Cfg) {
  return async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return route(async () => {
      await requireAuth();
      ensureSeed();
      const { id } = await params;
      const numId = Number(id);
      if (!Number.isInteger(numId)) throw new ApiError(cfg.notFoundCode);
      const exists = db.select().from(cfg.table).where(eq(cfg.table.id, numId)).limit(1).all()[0];
      if (!exists) throw new ApiError(cfg.notFoundCode);
      const parsed = cfg.updateSchema.parse(await req.json()) as Record<string, unknown>;
      const final = cfg.decorate ? cfg.decorate(parsed) : parsed;
      const updated = db.update(cfg.table).set(final).where(eq(cfg.table.id, numId)).returning().all() as unknown[];
      return Response.json(updated[0]);
    });
  };
}

export function deleteHandler(cfg: Cfg) {
  return async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    return route(async () => {
      await requireAuth();
      ensureSeed();
      const { id } = await params;
      const numId = Number(id);
      if (!Number.isInteger(numId)) throw new ApiError(cfg.notFoundCode);
      db.delete(cfg.table).where(eq(cfg.table.id, numId)).run();
      return Response.json({ ok: true });
    });
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
