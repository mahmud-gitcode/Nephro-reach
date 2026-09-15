/* ==========================================================================
   Reminder clock conversion
   --------------------------------------------------------------------------
   Reminders are stored the way a member reads them — "08:00 AM" — but the
   <input type="time"> that sets them speaks 24-hour. These two carry the
   value across that boundary, which is where the classic off-by-twelve
   lives: midnight is 12 AM and noon is 12 PM, and both are hour 12 on a
   display clock but 0 and 12 on a 24-hour one.
   ========================================================================== */

export function formatTo12Hour(time24: string): string {
  if (!time24) return "08:00 AM";
  const parts = time24.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  if (isNaN(h)) return "08:00 AM";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const hFormatted = h < 10 ? `0${h}` : `${h}`;
  return `${hFormatted}:${m} ${ampm}`;
}

export function formatTo24Hour(time12: string): string {
  if (!time12) return "08:00";
  const trimmed = time12.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return "08:00";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3]?.toUpperCase();

  if (ampm === "PM" && h < 12) {
    h += 12;
  } else if (ampm === "AM" && h === 12) {
    h = 0;
  }
  const hFormatted = h < 10 ? `0${h}` : `${h}`;
  return `${hFormatted}:${m}`;
}
