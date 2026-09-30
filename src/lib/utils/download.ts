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

/** Rows as CSV, each value quoted when it holds a comma, quote or newline. */
export function toCsv(rows: Array<Array<string | number>>): string {
  const cell = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((row) => row.map(cell).join(",")).join("\n");
}
