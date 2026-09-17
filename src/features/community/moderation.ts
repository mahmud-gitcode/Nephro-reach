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
  if (!text || !text.trim()) return false;
  const lower = text.toLowerCase();
  return AUTO_FLAG_PHRASES.some((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\b|\\W)${escaped}(?:$|\\b|\\W)`, "i");
    return regex.test(lower);
  });
}
