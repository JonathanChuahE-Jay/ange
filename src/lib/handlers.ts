import { ZodError } from "zod";
import { ApiError, errorJson } from "./errors";

/** Wrap a route body: ApiError → JSON error; ZodError → api.payload.invalid. */
export async function route(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) return errorJson(err.code, err.message);
    if (err instanceof ZodError) {
      const first = err.issues[0];
      return errorJson(
        "api.payload.invalid",
        `${first?.path.join(".") || "payload"}: ${first?.message ?? "invalid"}`,
      );
    }
    console.error("[ange] unhandled error:", err);
    return errorJson("server.internal_error", "Something went wrong.");
  }
}

export type PageParams = { page: number; pageSize: number };

export function parsePage(url: URL): PageParams {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "50") || 50));
  return { page, pageSize };
}

export function paged<T>(items: T[], total: number, p: PageParams) {
  return {
    items,
    total,
    page: p.page,
    pageSize: p.pageSize,
    hasPrev: p.page > 1,
    hasNext: p.page * p.pageSize < total,
  };
}
