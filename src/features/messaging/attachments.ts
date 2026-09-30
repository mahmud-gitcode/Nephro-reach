import { downscaleToDataUrl } from "@/features/personal-log/dialysis/useAccessPhotos";
import type { Attachment } from "./messaging.types";

/* ==========================================================================
   Message attachments
   --------------------------------------------------------------------------
   The file travels inside the message, as a data URL, because there is no
   file server yet. Photos are shrunk to the same 1024px JPEG the access
   photo log uses; anything else must be small, since the browser gives the
   whole portal about 5 MB. With a server, the file is uploaded and the
   message keeps a link.
   ========================================================================== */

/** The largest non-photo file a message can carry, in bytes. */
export const MAX_FILE_BYTES = 750 * 1024;

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** A picked file as an attachment, or an error message to show instead. */
export async function toAttachment(
  file: File,
): Promise<{ attachment: Attachment } | { error: string }> {
  if (file.type.startsWith("image/")) {
    const imageUrl = await downscaleToDataUrl(file);
    return {
      attachment: {
        name: file.name,
        sizeLabel: sizeLabel(Math.round((imageUrl.length * 3) / 4)),
        imageUrl,
      },
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      error: `That file is ${sizeLabel(file.size)}. Files up to ${sizeLabel(MAX_FILE_BYTES)} can be attached for now; photos of any size are shrunk to fit.`,
    };
  }
  return {
    attachment: {
      name: file.name,
      sizeLabel: sizeLabel(file.size),
      dataUrl: await readAsDataUrl(file),
    },
  };
}

/** Saves an attachment's file, if the message carries one. */
export function downloadAttachment(attachment: Attachment): boolean {
  const url = attachment.dataUrl ?? attachment.imageUrl;
  if (!url) return false;
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}
