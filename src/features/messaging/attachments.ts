import { isSafeLinkUrl } from "@/lib/utils/safeUrl";
import { checkUpload, uploadErrorMessage, UploadError } from "@/lib/api/upload";
import { downscaleToFile } from "@/features/personal-log/dialysis/useAccessPhotos";
import { sizeLabel } from "./messaging.mappers";
import type { Attachment } from "./messaging.types";

/* ==========================================================================
   Message attachments (Phase 11)
   --------------------------------------------------------------------------
   A picked file stays a File in memory until the message is sent; then it
   goes up through /files (uploadFile) and only its id goes with the
   message. Photos are shrunk to a JPEG File first. Nothing becomes a data:
   URL and nothing is stored. A sent file is opened through the message's
   short-lived link, asked for when the member or the office clicks it.
   ========================================================================== */

export { sizeLabel };

/** The client checks mirror the server's (types, 10 MB); it checks again. */
const ACCEPT_HINT = {
  en: "Use a photo, PDF, Word document or text file up to 10 MB.",
  es: "Use una foto, un PDF, un documento de Word o un texto de hasta 10 MB.",
} as const;

/** A picked file as an attachment, or an error message to show instead. */
export async function toAttachment(
  file: File,
  isEs = false,
): Promise<{ attachment: Attachment } | { error: string }> {
  const ready = file.type.startsWith("image/")
    ? await downscaleToFile(file)
    : file;
  const refused = checkUpload(ready);
  if (refused) {
    const why = uploadErrorMessage(new UploadError(refused, ""));
    return {
      error: isEs
        ? `No se puede adjuntar ese archivo. ${ACCEPT_HINT.es}`
        : `${why || "That file can't be attached."} ${ACCEPT_HINT.en}`.trim(),
    };
  }
  return {
    attachment: {
      name: ready.name,
      sizeLabel: sizeLabel(ready.size),
      contentType: ready.type,
      file: ready,
      ...(ready.type.startsWith("image/") &&
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function"
        ? { previewUrl: URL.createObjectURL(ready) }
        : {}),
    },
  };
}

/** Frees a picked image's preview. */
export function releaseAttachment(attachment: Attachment | null | undefined) {
  if (
    attachment?.previewUrl &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  )
    URL.revokeObjectURL(attachment.previewUrl);
}

/**
 * Opens a sent file: asks the server for its short-lived link and hands it
 * to the browser. Only an http(s) link is followed. Resolves false when
 * there was nothing safe to open.
 */
export async function openAttachment(
  link: () => Promise<{ url: string }>,
): Promise<boolean> {
  const { url } = await link();
  if (!isSafeLinkUrl(url)) return false;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return true;
}
