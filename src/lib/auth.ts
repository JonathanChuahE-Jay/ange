import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ApiError } from "./errors";

const COOKIE_NAME = "ange_session";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new ApiError("server.internal_error", "AUTH_SECRET not configured");
  return new TextEncoder().encode(s);
}

export async function createSession() {
  const token = await new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_COOKIE !== "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Verify the admin session; throws ApiError (401) when absent/expired. */
export async function requireAuth() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) throw new ApiError("auth.session.missing");
  try {
    await jwtVerify(token, secret());
  } catch {
    throw new ApiError("auth.session.expired");
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(password: unknown) {
  const expected = process.env.ADMIN_PASSWORD ?? "ange-admin";
  if (typeof password !== "string" || password !== expected) {
    throw new ApiError("auth.password.invalid", "That password isn't right.");
  }
}
