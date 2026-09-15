import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { INITIAL_REVIEWS } from "./reviews.seed";
import type { Review } from "./reviews.types";

export const REVIEWS_KEY = storageKey("community-reviews");

export async function listReviews(): Promise<Review[]> {
  const stored = await readJson<Review[] | null>(REVIEWS_KEY, null);
  return Array.isArray(stored) ? stored : INITIAL_REVIEWS;
}

export async function saveReviews(reviews: Review[]): Promise<Review[]> {
  return writeJson(REVIEWS_KEY, reviews);
}
