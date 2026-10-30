import type { ErrorCode } from "./errors";

/** Exhaustive friendly message for every API error code. */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  "auth.password.invalid": "That password isn't right — try again.",
  "auth.session.missing": "Please log in first.",
  "auth.session.expired": "Your session expired — log in again.",
  "gate.locked": "This page is locked — enter our first day first.",
  "gate.date.wrong": "That's not our day. Try again.",
  "gate.rate_limited": "Too many tries — wait a few minutes.",
  "content.settings.not_found": "Settings aren't initialized yet. Run mise run start once.",
  "content.settings.invalid": "Something in the settings looks off — check the fields.",
  "content.timeline.not_found": "That timeline moment doesn't exist anymore.",
  "content.timeline.invalid": "Check the timeline fields and try again.",
  "content.photos.not_found": "That photo doesn't exist anymore.",
  "content.photos.invalid": "Check the photo details and try again.",
  "upload.photo.too_large": "That photo is too big — keep it under 8 MB.",
  "upload.photo.unsupported_type": "Only JPG, PNG, WebP and GIF photos are supported.",
  "content.chats.not_found": "That chat message doesn't exist anymore.",
  "content.chats.invalid": "Check the chat fields and try again.",
  "content.tracks.not_found": "That song doesn't exist anymore.",
  "content.tracks.invalid": "Check the song details and try again.",
  "upload.track.too_large": "That audio file is too big — keep it under 16 MB.",
  "upload.track.unsupported_type": "Only audio files (MP3, M4A, WAV, OGG…) are supported.",
  "content.loves.not_found": "That love doesn't exist anymore.",
  "content.loves.invalid": "Check the fields and try again.",
  "content.prizes.not_found": "That prize doesn't exist anymore.",
  "content.prizes.invalid": "Check the prize fields and try again.",
  "spin.prizes.empty": "No prizes yet — add some in the admin panel.",
  "answer.invalid": "Hmm, that answer didn't go through — try again.",
  "api.payload.invalid": "Something looks wrong with what was sent.",
  "api.route.not_found": "That page doesn't exist.",
  "server.internal_error": "Something went wrong on our side.",
};

export function messageForCode(code: string | undefined | null): string {
  if (code && code in ERROR_MESSAGES) return ERROR_MESSAGES[code as ErrorCode];
  return "Something went wrong.";
}

export type ApiErrorShape = { code: string; message: string; backendVersion?: string };

export class RequestError extends Error {
  readonly code: string;
  readonly backendVersion?: string;
  constructor(err: ApiErrorShape) {
    super(err.message);
    this.code = err.code;
    this.backendVersion = err.backendVersion;
  }
}

async function parse(res: Response) {
  if (res.ok) return res.json();
  let body: { error?: ApiErrorShape } = {};
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  throw new RequestError(
    body.error ?? { code: "server.internal_error", message: "Something went wrong." },
  );
}

export const api = {
  async get<T>(url: string): Promise<T> {
    return parse(await fetch(url, { credentials: "same-origin" }));
  },
  async send<T>(url: string, method: string, body?: unknown): Promise<T> {
    return parse(
      await fetch(url, {
        method,
        credentials: "same-origin",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  },
  async upload<T>(url: string, form: FormData): Promise<T> {
    return parse(await fetch(url, { method: "POST", body: form, credentials: "same-origin" }));
  },
};
