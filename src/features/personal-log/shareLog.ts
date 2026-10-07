/* ==========================================================================
   Sharing a log — CSV and an email draft
   --------------------------------------------------------------------------
   The client (2026-10-05): Blood Pressure and Weight & Fluid get the same
   "export to share" as the medication log, and a member whose dialysis
   clinic is not on NephroReach can send their check-ins to an email they
   choose.

   With no server, sending is the member's own email app: a draft opens
   with the log in the body, addressed to whoever they typed. The CSV is a
   download they can attach. Nothing leaves the device without them.
   ========================================================================== */

export type LogTable = {
  /** Column names. */
  header: string[];
  rows: Array<Array<string | number>>;
};

function cell(value: string | number): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(table: LogTable): string {
  return [table.header, ...table.rows]
    .map((row) => row.map(cell).join(","))
    .join("\n");
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Mail clients cut long links; the body keeps the newest rows that fit
 *  and says how many more are in the download. */
const BODY_LIMIT = 1800;

export function emailBody(
  title: string,
  table: LogTable,
  footer = "Sent from my NephroReach personal log.",
): string {
  const lines = table.rows.map((row) =>
    table.header.map((h, i) => `${h}: ${row[i] ?? ""}`).join(" | "),
  );
  const kept: string[] = [];
  let length = title.length;
  for (const line of lines) {
    if (length + line.length + 1 > BODY_LIMIT) break;
    kept.push(line);
    length += line.length + 1;
  }
  const more = lines.length - kept.length;
  return [
    title,
    "",
    ...kept,
    ...(more > 0
      ? ["", `…and ${more} more entries in the attached CSV download.`]
      : []),
    "",
    footer,
  ].join("\n");
}

/** A log as a Share Outside NephroReach item: a short summary in the
 *  message (the share's message holds 1,500 characters) and the whole log
 *  attached as a CSV (client, 2026-10-07). */
export function outsideShareOf(
  title: string,
  fileName: string,
  table: LogTable,
  isEs: boolean,
): {
  kind: "log";
  subject: string;
  body: string;
  attachment: { name: string; type: string; dataUrl: string };
} {
  const lines = emailBody(title, table, "").split("\n");
  const kept: string[] = [];
  let length = 0;
  for (const line of lines) {
    if (length + line.length + 1 > 1300) break;
    kept.push(line);
    length += line.length + 1;
  }
  const note = isEs
    ? "El registro completo va adjunto como archivo CSV."
    : "The full log is attached as a CSV file.";
  return {
    kind: "log",
    subject: title,
    body: [...kept, note].join("\n").trim(),
    attachment: {
      name: `${fileName}.csv`,
      type: "text/csv",
      dataUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(toCsv(table))}`,
    },
  };
}

export function mailtoHref(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
