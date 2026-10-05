/* ==========================================================================
   Blood pressure check reminders
   --------------------------------------------------------------------------
   The client (2026-10-05): blood pressure checks need a reminder to check
   and log. The member picks the times of day; when one passes and no
   reading has been logged since, the bell asks them to check, and "Log
   reading" opens the form. (Logging straight from the reminder would need
   the numbers typed in, so the form is the answer.)

   Pure: times in, the due one out. Storage lives in useBpReminders.ts.
   ========================================================================== */

/** "HH:MM", 24-hour, earliest first. */
export type BpReminderTimes = string[];

export function cleanTimes(times: string[]): BpReminderTimes {
  return [...new Set(times.filter((t) => /^\d{2}:\d{2}$/.test(t)))].sort();
}

/**
 * The latest reminder time already passed today with no reading logged at
 * or after it — the check the member is being asked for — or null.
 */
export function dueCheck(
  times: BpReminderTimes,
  readings: Array<{ date: string; time: string }>,
  now: Date,
): string | null {
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const passed = cleanTimes(times).filter((t) => t <= clock);
  const latest = passed.at(-1);
  if (!latest) return null;
  const logged = readings.some((r) => r.date === today && r.time >= latest);
  return logged ? null : latest;
}
