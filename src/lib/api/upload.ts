/* ==========================================================================
   uploadFile: the one upload path (ADR 0007, ADR 0006 step 7, spec 018 §8)
   --------------------------------------------------------------------------
   1. POST /files/upload-url { filename, contentType, size, visibility? }
      The API checks the type and size, and returns a file id plus a
      presigned PUT.
   2. PUT the bytes to `upload.url`, sending EVERY header in
      `upload.headers`. They are signed: they carry the content type, the
      length and, in production, the encryption setting. Dropping one fails
      the signature or, worse, stores the object unencrypted.
   3. POST /files/{id}/complete, so the API checks the object landed.

   What this never does:
   - read or keep the storage key (the API no longer returns it; the file
     id is the only handle the app needs);
   - send cookies to the storage host (`credentials: "omit"`);
   - make a `data:` URL of the file;
   - ask for PUBLIC unless the caller says so (only content-team pages may,
     and the server checks that too).

   The client-side checks mirror the server's allowlist (backend
   src/core/files/files.constants.ts: no SVG, no HTML) and its 10 MB cap,
   so a member learns at once instead of after an upload. The server
   enforces both again; this is a courtesy, not the guard.
   ========================================================================== */

import { api, ApiError } from "./client";

/** Mirrors ALLOWED_CONTENT_TYPES in the backend. Keep them equal. */
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/webm",
] as const;

export type AllowedUploadType = (typeof ALLOWED_UPLOAD_TYPES)[number];

/** Mirrors the API's default S3_MAX_UPLOAD_BYTES (10 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadVisibility = "PRIVATE" | "PUBLIC";

export type UploadErrorReason =
  | "type_not_allowed"
  | "too_large"
  | "empty"
  | "bad_upload_url"
  | "storage_failed";

export class UploadError extends Error {
  constructor(
    readonly reason: UploadErrorReason,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

/** The part of the API's reply this module uses. `key` is not in it. */
type UploadUrlReply = {
  file: { id: string };
  upload: {
    url: string;
    method: "PUT";
    headers: Record<string, string>;
    expiresIn: number;
  };
};

type CompleteReply = { file: { id: string; status: string } };

function normalisedType(type: string): string {
  return type.trim().toLowerCase();
}

/** Why a file would be refused before any request, or null if it is fine. */
export function checkUpload(file: {
  type: string;
  size: number;
}): UploadErrorReason | null {
  if (
    !(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(
      normalisedType(file.type),
    )
  )
    return "type_not_allowed";
  if (file.size <= 0) return "empty";
  if (file.size > MAX_UPLOAD_BYTES) return "too_large";
  return null;
}

const MESSAGES: Record<UploadErrorReason, string> = {
  type_not_allowed:
    "This kind of file can't be uploaded. Use a photo, PDF, document, video or audio file.",
  too_large: "This file is larger than 10 MB.",
  empty: "This file is empty.",
  bad_upload_url: "The upload could not start. Please try again.",
  storage_failed: "The upload did not finish. Please try again.",
};

/* The storage host the CSP allows (NEXT_PUBLIC_STORAGE_ORIGIN). When it is
   set, a presigned URL for any other host is refused: the browser would
   block it anyway, and the file's bytes must not go anywhere else. */
function assertUploadUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch (cause) {
    throw new UploadError("bad_upload_url", MESSAGES.bad_upload_url, cause);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new UploadError("bad_upload_url", MESSAGES.bad_upload_url);
  const expected = process.env.NEXT_PUBLIC_STORAGE_ORIGIN?.replace(/\/$/, "");
  if (expected && url.origin !== expected)
    throw new UploadError("bad_upload_url", MESSAGES.bad_upload_url);
  return url;
}

export type UploadOptions = {
  /** PRIVATE unless a content-team page asks otherwise. */
  visibility?: UploadVisibility;
  /** Overrides `file.name`. */
  filename?: string;
  signal?: AbortSignal;
};

/**
 * Uploads one file and returns its file id. Throws UploadError for a file
 * the client refuses or a failed storage PUT, and ApiError for anything the
 * API refuses (type, size, permission).
 */
export async function uploadFile(
  file: Blob & { name?: string },
  options: UploadOptions = {},
): Promise<string> {
  const refused = checkUpload(file);
  if (refused) throw new UploadError(refused, MESSAGES[refused]);

  const contentType = normalisedType(file.type);
  const reply = await api<UploadUrlReply>("/files/upload-url", {
    method: "POST",
    body: {
      filename: options.filename ?? file.name ?? "upload",
      contentType,
      size: file.size,
      ...(options.visibility ? { visibility: options.visibility } : {}),
    },
    signal: options.signal,
  });

  const id = reply.file.id;
  const url = assertUploadUrl(reply.upload.url);

  let put: Response;
  try {
    put = await fetch(url.toString(), {
      method: reply.upload.method ?? "PUT",
      /* Every signed header, as given. The browser fills in Content-Length
         from the body itself; the rest must match the signature. */
      headers: { ...reply.upload.headers },
      body: file,
      credentials: "omit",
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError")
      throw cause;
    throw new UploadError("storage_failed", MESSAGES.storage_failed, cause);
  }
  if (!put.ok) throw new UploadError("storage_failed", MESSAGES.storage_failed);

  await api<CompleteReply>(`/files/${encodeURIComponent(id)}/complete`, {
    method: "POST",
    signal: options.signal,
  });
  return id;
}

/** Member-readable text for an upload failure. */
export function uploadErrorMessage(error: unknown): string {
  if (error instanceof UploadError) return error.message;
  if (error instanceof ApiError && error.status === 400)
    return error.messages[0] ?? MESSAGES.storage_failed;
  if (error instanceof ApiError && error.status === 403)
    return "You don't have permission to upload this file.";
  return MESSAGES.storage_failed;
}
