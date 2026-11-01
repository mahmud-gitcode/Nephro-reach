/**
 * Saves text the page built (a CSV export, a note) as a file on the
 * user's device. Nothing leaves the browser.
 */
export function downloadText(
  filename: string,
  text: string,
  type = "text/csv",
): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Freed on the next tick: revoking synchronously can beat the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * One CSV cell. Quoted when it holds a comma, quote or line break. Text that
 * a spreadsheet would run as a formula (= + - @, tab, carriage return) gets a
 * leading apostrophe, so a note typed as =HYPERLINK(...) opens as plain text
 * in Excel instead of sending other rows' patient data anywhere (OWASP CSV
 * injection). Plain numbers, negative ones included, are left as numbers.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (typeof value === "number") return String(value);
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows as CSV, one {@link csvCell} per value. */
export function toCsv(rows: Array<Array<string | number>>): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
