/* ==========================================================================
   Auto-flagging a post
   --------------------------------------------------------------------------
   A peer-support board for dialysis patients. This is the check that holds
   a post for review rather than publishing it — medical advice between
   members, and the handful of phrases that mean someone is being asked for
   money.

   It is deliberately a word-boundary match, not a substring one: "cash app"
   should flag, "cashew" should not.

   It errs towards flagging, and it is not a safety mechanism on its own —
   it is the first pass before a human sees the post. Nothing here should be
   loosened without someone deciding that a missed post is acceptable.
   ========================================================================== */

export const AUTO_FLAG_PHRASES: string[] = [
  // Emergency / Medical Crisis
  "chest pain",
  "can't breathe",
  "cant breathe",
  "shortness of breath",
  "passed out",
  "fainted",
  "seizure",
  "stroke",
  "confused",
  "unresponsive",
  "bleeding",
  "severe pain",
  "911",
  "er",
  "emergency",
  "life-threatening",
  "life threatening",

  // Dialysis Access Concerns
  "access bleeding",
  "fistula bleeding",
  "graft bleeding",
  "catheter bleeding",
  "no bruit",
  "no thrill",
  "access swollen",
  "access infected",
  "pus",
  "redness",
  "warm to touch",
  "fever",
  "chills",

  // Dangerous Symptoms During/After Dialysis
  "very dizzy",
  "low blood pressure",
  "cramping bad",
  "throwing up",
  "heart racing",
  "palpitations",
  "severe headache",
  "can't stay awake",
  "cant stay awake",
  "blue lips",
  "fluid overload",

  // Mental Health / Safety
  "i want to die",
  "suicide",
  "kill myself",
  "hurt myself",
  "hurt someone",
  "hopeless",
  "abuse",
  "neglect",
  "domestic violence",

  // Medical Advice Requests
  "what dose should i take",
  "should i stop my medicine",
  "should i skip dialysis",
  "can i miss treatment",
  "should i take extra",
  "change my dose",
  "diagnose me",
  "treat this",
  "prescribe",
  "medication reaction",

  // Unsafe Community Behavior
  "idiot",
  "stupid",
  "shut up",
  "racist",
  "threat",
  "fight",
  "harass",
  "scam",
  "cash app",
  "send money",
  "buy pills",
  "sell medication",
];

/* ==========================================================================
   Hostility aimed at another member
   --------------------------------------------------------------------------
   The list above reads for a member in trouble: "i want to die", "kill
   myself", "hurt myself" — all first person. None of it catches the same
   words pointed at someone else, so "Die already" under another member's
   post matched nothing and posted. That is the case this list covers.

   What is deliberately NOT here: "worthless", "useless", "burden",
   "garbage", "trash". On a dialysis board those are overwhelmingly people
   describing their own bad day — "I feel like garbage today" — and flagging
   them would train members that the board fights them. A death wish or a
   slur aimed outward has no such innocent reading.
   ========================================================================== */

export const HARASSMENT_PHRASES: string[] = [
  // Death wishes directed outward
  "die already",
  "just die",
  "go die",
  "drop dead",
  "kill yourself",
  "kys",
  "you should die",
  "hope you die",
  "wish you were dead",
  "you deserve to die",

  // Contempt for another member
  "hate you",
  "nobody cares",
  "no one cares",
  "waste of space",
  "loser",
  "pathetic",
  "moron",
  "retard",
  "freak",
  "get lost",
];

/** Every phrase that holds text back, whichever list it came from. */
export const ALL_FLAG_PHRASES: string[] = [
  ...AUTO_FLAG_PHRASES,
  ...HARASSMENT_PHRASES,
];

/**
 * Why a piece of text was held, so the member is told the truth about it.
 *
 * The board used to answer every flag with "it mentions symptoms that may
 * need urgent medical attention — call 911". Shown to someone who typed
 * "Die already" that is nonsense, and nonsense is what teaches people the
 * check is broken and worth working around.
 */
export type FlagCategory = "harassment" | "medical";

export function flagReason(text: string): FlagCategory | null {
  return flagDetail(text)?.category ?? null;
}

/**
 * The reason plus the phrase that fired it.
 *
 * A moderator reading a held reply needs to see what the screen caught, not
 * just that something did — a queue of "flagged: harassment" with no phrase
 * is a queue nobody can audit or tune.
 */
export function flagDetail(
  text: string,
): { category: FlagCategory; phrase: string } | null {
  const hostile = firstMatch(text, HARASSMENT_PHRASES);
  if (hostile) return { category: "harassment", phrase: hostile };
  const medical = firstMatch(text, AUTO_FLAG_PHRASES);
  if (medical) return { category: "medical", phrase: medical };
  return null;
}

/**
 * How a piece of text may reach the board.
 *
 * `block` and `review` are deliberately different outcomes. Hostility is
 * held for a moderator, because the useful thing to know about a member
 * typing abuse is that they keep doing it. A medical or crisis phrase is
 * refused outright and answered with "call 911" — telling someone with
 * chest pain that a moderator will look at their post soon would invite
 * them to wait for it.
 */
export type PublishRoute = "allow" | "review" | "block";

export function routeForCommunity(text: string): PublishRoute {
  if (!text.trim()) return "block";
  const detail = flagDetail(text);
  if (!detail) return "allow";
  return detail.category === "harassment" ? "review" : "block";
}

/**
 * Whether this text may be published to the board at all.
 *
 * One gate for every way something reaches the community — a new post and a
 * reply to one. They used to disagree: the composer disabled its button on a
 * flagged phrase while the reply box showed the same warning and posted
 * anyway, so the strictest path in the feature was also the least used one.
 *
 * Empty text is not publishable either, so callers do not have to remember
 * two separate checks.
 */
export function canPublishToCommunity(text: string): boolean {
  return Boolean(text.trim()) && !checkFlaggedMedicalContent(text);
}

export function checkFlaggedMedicalContent(text: string): boolean {
  return matchesAny(text, ALL_FLAG_PHRASES);
}

function matchesAny(text: string, phrases: string[]): boolean {
  return firstMatch(text, phrases) !== null;
}

function firstMatch(text: string, phrases: string[]): string | null {
  if (!text || !text.trim()) return null;
  const lower = text.toLowerCase();
  return (
    phrases.find((phrase) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|\\b|\\W)${escaped}(?:$|\\b|\\W)`, "i");
      return regex.test(lower);
    }) ?? null
  );
}
