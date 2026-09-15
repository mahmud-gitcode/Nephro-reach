import { SPANISH_DAYS } from "./record.options";

/* ==========================================================================
   Reading a record's date
   --------------------------------------------------------------------------
   Record dates are strings written for display — "Friday, Jun 19, 2026" in
   some places, "Jun 19, 2026" in others — so the weekday has to be
   recovered from whatever shape arrived.

   There used to be a DATE_TO_DAY_MAP above this: twelve dates in June 2026
   hand-mapped to their weekdays, consulted before falling through to the
   parser below. Every one of the twelve agreed with the parser, so the map
   only decided what happened on the thirteenth date — which is to say it
   did nothing except look authoritative.
   ========================================================================== */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Splits "Friday, Jun 19" into its weekday and the rest. */
export function parseDayAndDate(str: string) {
  const commaIndex = str.indexOf(",");
  if (commaIndex !== -1) {
    return {
      day: str.slice(0, commaIndex).trim() + ",",
      date: str.slice(commaIndex + 1).trim(),
    };
  }
  return { day: str, date: "" };
}

/**
 * The weekday and the date, in the member's language.
 *
 * Takes the weekday from the string when it carries one, and works it out
 * otherwise. An unparseable date gets "-" rather than "Invalid Date".
 */
export function getDayAndDate(dateStr: string, isEs: boolean) {
  let dayName = "";
  let datePart = dateStr.trim();

  if (datePart.includes(",")) {
    const parts = datePart.split(",");
    if (parts.length === 3) {
      dayName = parts[0].trim();
      datePart = `${parts[1].trim()}, ${parts[2].trim()}`;
    }
  }

  if (!dayName) {
    const parsed = new Date(datePart);
    if (!Number.isNaN(parsed.getTime())) {
      dayName = WEEKDAYS[parsed.getDay()];
    }
  }

  const localizedDay =
    isEs && SPANISH_DAYS[dayName] ? SPANISH_DAYS[dayName] : dayName;

  return { day: localizedDay || "-", date: datePart };
}
