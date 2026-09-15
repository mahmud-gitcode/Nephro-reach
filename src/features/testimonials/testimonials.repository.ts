import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { INITIAL_TESTIMONIALS } from "./testimonials.seed";
import type { Testimonial } from "./testimonials.types";

const KEY = storageKey("video-testimonials");

export async function listTestimonials(): Promise<Testimonial[]> {
  const stored = await readJson<Testimonial[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : INITIAL_TESTIMONIALS;
}

export async function saveTestimonials(
  testimonials: Testimonial[],
): Promise<Testimonial[]> {
  return writeJson(KEY, testimonials);
}
