import { BACKEND_VERSION } from "./versions";

/** Namespaced, snake_case error codes — every code the API can emit lives here. */
export const ERROR_CODES = [
  // auth
  "auth.password.invalid",
  "auth.session.missing",
  "auth.session.expired",
  // date gate (public site)
  "gate.locked",
  "gate.date.wrong",
  "gate.rate_limited",
  // settings
  "content.settings.not_found",
  "content.settings.invalid",
  // timeline
  "content.timeline.not_found",
  "content.timeline.invalid",
  // photos
  "content.photos.not_found",
  "content.photos.invalid",
  "upload.photo.too_large",
  "upload.video.too_large",
  "upload.video.unsupported_type",
  "upload.photo.unsupported_type",
  // chats
  "content.chats.not_found",
  "content.chats.invalid",
  // tracks (uploaded songs)
  "content.tracks.not_found",
  "content.tracks.invalid",
  "upload.track.too_large",
  "upload.track.unsupported_type",
  // loves
  "content.loves.not_found",
  "content.loves.invalid",
  // quiz
  "content.quiz.not_found",
  "content.quiz.invalid",
  // prizes
  "content.prizes.not_found",
  "content.prizes.invalid",
  // misc
  "spin.prizes.empty",
  "answer.invalid",
  "api.payload.invalid",
  "api.route.not_found",
  "server.internal_error",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  "auth.password.invalid": 401,
  "auth.session.missing": 401,
  "auth.session.expired": 401,
  "gate.locked": 403,
  "gate.date.wrong": 401,
  "gate.rate_limited": 429,
  "content.settings.not_found": 500,
  "content.settings.invalid": 400,
  "content.timeline.not_found": 404,
  "content.timeline.invalid": 400,
  "content.photos.not_found": 404,
  "content.photos.invalid": 400,
  "upload.photo.too_large": 413,
  "upload.video.too_large": 413,
  "upload.video.unsupported_type": 415,
  "upload.photo.unsupported_type": 415,
  "content.chats.not_found": 404,
  "content.chats.invalid": 400,
  "content.tracks.not_found": 404,
  "content.tracks.invalid": 400,
  "upload.track.too_large": 413,
  "upload.track.unsupported_type": 415,
  "content.loves.not_found": 404,
  "content.loves.invalid": 400,
  "content.quiz.not_found": 404,
  "content.quiz.invalid": 400,
  "content.prizes.not_found": 404,
  "content.prizes.invalid": 400,
  "spin.prizes.empty": 409,
  "answer.invalid": 400,
  "api.payload.invalid": 400,
  "api.route.not_found": 404,
  "server.internal_error": 500,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}

export type ErrorBody = {
  error: { code: ErrorCode; message: string; backendVersion: string };
};

export function errorJson(code: ErrorCode, message?: string): Response {
  const err = new ApiError(code, message);
  const body: ErrorBody = {
    error: {
      code: err.code,
      message: err.message,
      backendVersion: BACKEND_VERSION,
    },
  };
  return Response.json(body, { status: err.status });
}
