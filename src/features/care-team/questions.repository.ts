import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_QUESTIONS } from "./questions.seed";
import type { CareTeamQuestion } from "./questions.types";

const KEY = storageKey("care-team-questions");

export async function listQuestions(): Promise<CareTeamQuestion[]> {
  const stored = await readJson<CareTeamQuestion[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : SEED_QUESTIONS;
}

export async function saveQuestions(
  questions: CareTeamQuestion[],
): Promise<CareTeamQuestion[]> {
  return writeJson(KEY, questions);
}
