import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, ensureSeed } from "./db";
import * as t from "./schema";
import { ApiError } from "./errors";
import { isAuthenticated } from "./auth";

/**
 * Date gate for the public site. The visitor must enter the couple's first
 * day (settings.anniversary_date, "YYYY-MM-DD"). On success we set an
 * HttpOnly signed cookie bound to a hash of the date, so changing the date in
 * admin instantly re-locks every device. The admin session always bypasses.
 */

const COOKIE = "ange_unlock";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new ApiError("server.internal_error", "AUTH_SECRET not configured");
  return new TextEncoder().encode(s);
}

function dateTag(date: string) {
  return createHash("sha256").update(`ange-gate:${date}`).digest("hex").slice(0, 24);
}

export function getAnniversaryDate(): string {
  ensureSeed();
  return db.select({ d: t.settings.anniversaryDate }).from(t.settings).limit(1).all()[0]?.d ?? "";
}

/** Gate is configured when admin has set a date. Unset = locked for guests. */
export function gateConfigured() {
  return /^\d{4}-\d{2}-\d{2}$/.test(getAnniversaryDate());
}

export async function isUnlocked(): Promise<boolean> {
  if (await isAuthenticated()) return true;
  const date = getAnniversaryDate();
  if (!date) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.tag === dateTag(date);
  } catch {
    return false;
  }
}

export async function requireUnlocked() {
  if (!(await isUnlocked())) throw new ApiError("gate.locked", "This page is locked.");
}

// ---- brute-force protection: 6 attempts per 10 minutes per client ----
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRIES = 6;
const attempts = new Map<string, number[]>();

const GLOBAL_MAX = 30; // across all clients — caps guessing even if keys are spoofed

export function rateLimit(key: string) {
  const now = Date.now();
  const all = (attempts.get("*") ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (all.length >= GLOBAL_MAX) {
    throw new ApiError("gate.rate_limited", "Too many tries right now — wait a few minutes.");
  }
  all.push(now);
  attempts.set("*", all);
  const recent = (attempts.get(key) ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MAX_TRIES) {
    const wait = Math.ceil((WINDOW_MS - (now - recent[0])) / 60000);
    throw new ApiError("gate.rate_limited", `Too many tries — wait ${wait} min and try again.`);
  }
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 5000) attempts.clear();
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}

export async function tryUnlock(date: string) {
  const expected = getAnniversaryDate();
  if (!expected || date !== expected) {
    throw new ApiError("gate.date.wrong", "That's not our day. Try again.");
  }
  const token = await new SignJWT({ sub: "guest", tag: dateTag(expected) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_COOKIE !== "1",
    path: "/",
    maxAge: MAX_AGE,
  });
}
