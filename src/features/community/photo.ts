/* A community photo, shrunk to a small JPEG before it is uploaded (client,
   2026-10-05: a meal, a recipe). The bytes go to /files as a Blob; nothing
   is kept as a data: URL (ADR 0007 §4). */

const MAX_EDGE = 1280;
const QUALITY = 0.82;

export function scaledSize(
  width: number,
  height: number,
  maxEdge: number = MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest <= 0) return { width, height };
  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/** Rejects rather than falling back to the original file. */
export async function downscaleToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = scaledSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot resize the image.");
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("The photo was not read.")),
        "image/jpeg",
        QUALITY,
      ),
    );
  } finally {
    bitmap.close();
  }
}
