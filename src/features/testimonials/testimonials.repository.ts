import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { INITIAL_TESTIMONIALS } from "./testimonials.seed";
import type { Testimonial } from "./testimonials.types";

const KEY = storageKey("video-testimonials");

/* The first sample link (a joke video) was swapped for the client's
   placeholder (2026-10-15); a browser that saved the old samples gets the
   new link too. */
const OLD_SAMPLE = "dQw4w9WgXcQ";
const SAMPLE_URL = "https://youtu.be/Hu7-vb7WNlY";

export async function listTestimonials(): Promise<Testimonial[]> {
  const stored = await readJson<Testimonial[] | null>(KEY, null);
  if (!Array.isArray(stored)) return INITIAL_TESTIMONIALS;
  return stored.map((t) =>
    t.videoUrl?.includes(OLD_SAMPLE) ? { ...t, videoUrl: SAMPLE_URL } : t,
  );
}

export async function saveTestimonials(
  testimonials: Testimonial[],
): Promise<Testimonial[]> {
  return writeJson(KEY, testimonials);
}
