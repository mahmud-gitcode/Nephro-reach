import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  buildPdfDocument,
  pdfBytes,
  type PdfPage,
} from "@/lib/utils/pdf";
import {
  CONTROL,
  PORTALS,
  SECTIONS,
  localize,
  type Cell,
  type Limited,
} from "./portalComparison.data";

/* ==========================================================================
   Portal Comparison as a PDF
   --------------------------------------------------------------------------
   The same table as the admin page, laid out on US Letter pages with the
   app's own small PDF writer: the comparison, then every "Limited" cell
   spelled out, then who controls staff and roles. Courier is fixed-width,
   so wrapping is counted in characters.
   ========================================================================== */

const MARGIN = 40;
const BODY = 8;
/** Courier: every glyph is 0.6 em. */
const charsFor = (width: number, size: number) =>
  Math.floor(width / (size * 0.6));

/** The writer is WinAnsi-only: swap the typographic characters it lacks. */
function plain(text: string): string {
  return text
    .replace(/[—–]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...");
}

function wrap(text: string, max: number): string[] {
  const words = plain(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** A page-filling cursor: text goes down the page, a new page when full. */
class Layout {
  pages: PdfPage[] = [];
  y = 0;

  constructor() {
    this.newPage();
  }

  newPage() {
    this.pages.push({ texts: [], lines: [] });
    this.y = PAGE_HEIGHT - MARGIN;
  }

  get page(): PdfPage {
    return this.pages[this.pages.length - 1];
  }

  /** Room for `height` points, or a new page. */
  need(height: number) {
    /* The page number sits below MARGIN; keep a little air above it. */
    if (this.y - height < MARGIN + 8) this.newPage();
  }

  text(text: string, x: number, size = BODY, bold = false) {
    this.page.texts.push({ text: plain(text), x, y: this.y, size, bold });
  }

  rule(width = 0.5) {
    this.page.lines.push({
      x1: MARGIN,
      y1: this.y,
      x2: PAGE_WIDTH - MARGIN,
      y2: this.y,
      width,
    });
  }
}

const FEATURE_WIDTH = 220;
const COL_WIDTH = (PAGE_WIDTH - MARGIN * 2 - FEATURE_WIDTH) / PORTALS.length;
const colX = (i: number) => MARGIN + FEATURE_WIDTH + i * COL_WIDTH;

function cellText(cell: Cell, isEs = false): string {
  if (typeof cell === "number") return String(cell);
  if (cell === "yes") return isEs ? "Sí" : "Yes";
  if (cell === "no") return "-";
  return isEs ? "Limitado*" : "Limited*";
}

/** The comparison as PDF file bytes (Spanish when `isEs`; WinAnsi carries
 *  the accented letters). */
export function comparisonPdf(
  today = new Date(),
  isEs = false,
): Uint8Array<ArrayBuffer> {
  const l = new Layout();
  const line = BODY + 4;
  const tr = (text: string) => localize(text, isEs);
  const docTitle = isEs
    ? "NephroReach - Comparación de portales"
    : "NephroReach - Portal Comparison";

  /* Title */
  l.text(docTitle, MARGIN, 16, true);
  l.y -= 18;
  const generated = today.toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  l.text(
    isEs
      ? `Lo que tiene el portal de cada organización. Generado el ${generated}.`
      : `What each organization's portal has. Generated ${generated}.`,
    MARGIN,
  );
  l.y -= line;
  l.text(
    isEs
      ? "Sí = lo tiene   - = no lo tiene   Limitado* = en parte; vea las notas después de la tabla"
      : "Yes = has it   - = does not have it   Limited* = partly; see the notes after the table",
    MARGIN,
  );
  l.y -= line + 6;

  /* Table header, repeated on every page the table runs onto. */
  const header = () => {
    const nameLines = PORTALS.map((p) =>
      wrap(tr(p.name), charsFor(COL_WIDTH - 6, BODY)),
    );
    const rows = Math.max(...nameLines.map((n) => n.length));
    l.need(rows * line + 6);
    l.text(isEs ? "Función" : "Feature", MARGIN, BODY, true);
    nameLines.forEach((lines, i) =>
      lines.forEach((t, j) =>
        l.page.texts.push({
          text: t,
          x: colX(i),
          y: l.y - j * line,
          size: BODY,
          bold: true,
        }),
      ),
    );
    l.y -= (rows - 1) * line + 4;
    l.rule(0.8);
    l.y -= line;
  };
  header();

  for (const section of SECTIONS) {
    l.need(line * 2);
    if (l.page.texts.length === 0) header();
    l.text(tr(section.title).toUpperCase(), MARGIN, BODY, true);
    l.y -= line;
    for (const row of section.rows) {
      const lines = wrap(tr(row.feature), charsFor(FEATURE_WIDTH - 8, BODY));
      const before = l.pages.length;
      l.need(lines.length * line + 2);
      if (l.pages.length !== before) header();
      lines.forEach((t, j) =>
        l.page.texts.push({
          text: t,
          x: MARGIN,
          y: l.y - j * line,
          size: BODY,
        }),
      );
      PORTALS.forEach((p, i) =>
        l.text(cellText(row.cells[p.id], isEs), colX(i)),
      );
      l.y -= (lines.length - 1) * line + 4;
      l.rule(0.3);
      l.y -= line;
    }
  }

  /* Every Limited cell, spelled out. */
  const limited: Array<{ feature: string; portal: string; detail: Limited }> =
    [];
  for (const section of SECTIONS) {
    for (const row of section.rows) {
      for (const p of PORTALS) {
        const cell = row.cells[p.id];
        if (typeof cell === "object") {
          limited.push({
            feature: tr(row.feature),
            portal: tr(p.name),
            detail: cell,
          });
        }
      }
    }
  }

  const full = charsFor(PAGE_WIDTH - MARGIN * 2 - 12, BODY);
  l.y -= line;
  l.need(line * 3);
  l.text(
    isEs
      ? "* Limitado - qué se incluye y qué no"
      : "* Limited - what is and is not included",
    MARGIN,
    12,
    true,
  );
  l.y -= line + 6;
  for (const item of limited) {
    l.need(line * 4);
    l.text(`${item.feature} - ${item.portal}`, MARGIN, BODY + 1, true);
    l.y -= line;
    const list = (label: string, mark: string, entries: string[]) => {
      l.need(line * 2);
      l.text(label, MARGIN + 6, BODY, true);
      l.y -= line;
      for (const entry of entries) {
        const lines = wrap(tr(entry), full - 4);
        l.need(lines.length * line);
        lines.forEach((t, j) => {
          l.text(j === 0 ? `${mark} ${t}` : `  ${t}`, MARGIN + 12);
          l.y -= line;
        });
      }
    };
    list(isEs ? "Tiene:" : "Has:", "+", item.detail.included);
    list(isEs ? "No tiene:" : "Does not have:", "x", item.detail.notIncluded);
    l.y -= 6;
  }

  /* Who controls staff and roles — kept together on one page. */
  l.y -= line;
  l.need(line * (4 + CONTROL.length * 2) + 30);
  l.text(
    isEs
      ? "Quién controla el personal y los roles"
      : "Who controls staff and roles",
    MARGIN,
    12,
    true,
  );
  l.y -= line + 6;
  const c1 = 150;
  const c2 = 180;
  const cols = [MARGIN, MARGIN + c1, MARGIN + c1 + c2];
  const widths = [c1, c2, PAGE_WIDTH - MARGIN - (MARGIN + c1 + c2)];
  (isEs
    ? [
        "Organización",
        "Crea roles y activa/desactiva funciones",
        "Agrega personal y asigna roles",
      ]
    : [
        "Organization",
        "Creates roles & turns features on/off",
        "Adds staff & assigns roles",
      ]
  ).forEach((h, i) => {
    wrap(h, charsFor(widths[i] - 8, BODY)).forEach((t, j) =>
      l.page.texts.push({
        text: t,
        x: cols[i],
        y: l.y - j * line,
        size: BODY,
        bold: true,
      }),
    );
  });
  l.y -= line + 4;
  l.rule(0.8);
  l.y -= line;
  for (const row of CONTROL) {
    const cells = [row.portal, row.roles, row.staff].map((t, i) =>
      wrap(tr(t), charsFor(widths[i] - 8, BODY)),
    );
    const rows = Math.max(...cells.map((c) => c.length));
    l.need(rows * line + 4);
    cells.forEach((lines, i) =>
      lines.forEach((t, j) =>
        l.page.texts.push({
          text: t,
          x: cols[i],
          y: l.y - j * line,
          size: BODY,
        }),
      ),
    );
    l.y -= (rows - 1) * line + 4;
    l.rule(0.3);
    l.y -= line;
  }

  /* Page numbers, once the count is known. */
  l.pages.forEach((page, i) =>
    page.texts.push({
      text: isEs
        ? `${docTitle}   Página ${i + 1} de ${l.pages.length}`
        : `NephroReach - Portal Comparison   Page ${i + 1} of ${l.pages.length}`,
      x: MARGIN,
      y: MARGIN - 10,
      size: 7,
    }),
  );

  return pdfBytes(buildPdfDocument(l.pages, docTitle));
}

/** Builds the PDF and hands it to the browser to save. */
export function downloadComparisonPdf(isEs = false): void {
  const blob = new Blob([comparisonPdf(new Date(), isEs)], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nephroreach-portal-comparison-${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
