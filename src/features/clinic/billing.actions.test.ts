import { describe, expect, it } from "vitest";
import {
  EMPTY_ACTIONS,
  addChangeRequest,
  applyPayments,
  changeRequestError,
  changeTopicLabel,
  invoiceDocument,
  invoiceFilename,
  invoicePage,
  markPaid,
  normaliseActions,
  renewalLabel,
} from "./billing.actions";
import type { Invoice } from "./billing.data";
import { PAGE_HEIGHT, PAGE_WIDTH, textWidth } from "@/lib/utils/pdf";

function invoice(patch: Partial<Invoice> & { number: string }): Invoice {
  return {
    period: "Sep 2026",
    issued: new Date(2026, 8, 1),
    due: new Date(2026, 8, 15),
    amount: 1995,
    status: "Due",
    ...patch,
  };
}

describe("settling an invoice", () => {
  it("leaves the billed list alone when nothing has been paid here", () => {
    // Invoices are derived from the contract; a payment must not be written
    // onto them, or there are two disagreeing answers to what was billed.
    const billed = [invoice({ number: "INV-2026-09" })];
    expect(applyPayments(billed, [])).toBe(billed);
  });

  it("folds a local payment in on read", () => {
    const billed = [
      invoice({ number: "INV-2026-09" }),
      invoice({ number: "INV-2026-08" }),
    ];
    const shown = applyPayments(billed, ["INV-2026-09"]);

    expect(shown[0].status).toBe("Paid");
    expect(shown[1].status).toBe("Due");
  });

  it("does not touch an invoice that was already paid", () => {
    const billed = [invoice({ number: "INV-2026-09", status: "Paid" })];
    const shown = applyPayments(billed, ["INV-2026-09"]);
    expect(shown[0]).toBe(billed[0]);
  });

  it("records a payment once however many times it is confirmed", () => {
    // A double-submitted sheet must not leave two claims on one invoice.
    const once = markPaid(EMPTY_ACTIONS, ["INV-2026-09"]);
    const twice = markPaid(once, ["INV-2026-09", "INV-2026-08"]);

    expect(twice.paidInvoices).toEqual(["INV-2026-09", "INV-2026-08"]);
  });
});

describe("asking for a contract change", () => {
  it("refuses a request too short to act on", () => {
    // "more seats" gives NephroReach nothing to work from, and a request
    // that has to be chased is worse than one not yet sent.
    expect(changeRequestError("")).not.toBeNull();
    expect(changeRequestError("more")).not.toBeNull();
    expect(
      changeRequestError("We need 20 more slots from November"),
    ).toBeNull();
  });

  it("ignores whitespace when measuring it", () => {
    expect(changeRequestError("   \n  ")).not.toBeNull();
  });

  it("keeps the newest request first", () => {
    // The card shows the latest one, which is the one just sent.
    const first = addChangeRequest(EMPTY_ACTIONS, "seats", "Twenty more slots");
    const second = addChangeRequest(first, "fee", "Review the monthly fee");

    expect(second.changeRequests).toHaveLength(2);
    expect(second.changeRequests[0].topic).toBe("fee");
  });

  it("trims what it stores", () => {
    const next = addChangeRequest(EMPTY_ACTIONS, "other", "  Please call  ");
    expect(next.changeRequests[0].detail).toBe("Please call");
  });

  it("names every topic and renewal choice", () => {
    expect(changeTopicLabel("seats")).toBe("Patient slots");
    expect(renewalLabel("end")).toBe("Do not renew");
  });
});

describe("the downloaded invoice", () => {
  const paid = invoice({ number: "INV-2026-09", status: "Paid" });

  it("lays out everything the clinic needs to file or forward it", () => {
    // Asserted on the page model rather than the PDF bytes: this is the
    // layout's job, and pdf.ts already proves the bytes are a valid file.
    const said = invoicePage(paid, "Sunshine Dialysis")
      .texts.map((item) => item.text)
      .join(" | ");

    expect(said).toContain("NEPHROREACH");
    expect(said).toContain("Invoice INV-2026-09");
    expect(said).toContain("Sunshine Dialysis");
    expect(said).toContain("Sep 2026");
    expect(said).toContain("$1,995");
    expect(said).toContain("Paid");
  });

  it("right-aligns the money against the right margin", () => {
    // Courier is fixed width, so the total and the line item land on the
    // same right edge rather than nearly the same one.
    const { texts } = invoicePage(paid, "Sunshine Dialysis");
    const amounts = texts.filter((item) => item.text.startsWith("$"));

    expect(amounts).toHaveLength(2);
    const rightEdges = amounts.map(
      (item) => item.x + textWidth(item.text, item.size ?? 10),
    );
    expect(rightEdges[0]).toBeCloseTo(rightEdges[1]);
    expect(rightEdges[0]).toBeCloseTo(PAGE_WIDTH - 56);
  });

  it("keeps every row on the page", () => {
    const { texts, lines } = invoicePage(paid, "Sunshine Dialysis");

    for (const item of texts) {
      expect(item.y).toBeGreaterThan(0);
      expect(item.y).toBeLessThan(PAGE_HEIGHT);
    }
    expect(lines.length).toBeGreaterThan(0);
  });

  it("produces a file a reader will open", () => {
    const file = invoiceDocument(paid, "Sunshine Dialysis");
    expect(file.startsWith("%PDF-1.4")).toBe(true);
    expect(file.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("names the file after the invoice, as a PDF", () => {
    expect(invoiceFilename(invoice({ number: "INV-2026-09" }))).toBe(
      "INV-2026-09.pdf",
    );
  });
});

describe("reading the stored record back", () => {
  it("falls back to the contract's own setting when nothing is stored", () => {
    expect(normaliseActions(null)).toEqual(EMPTY_ACTIONS);
    expect(normaliseActions("nonsense").renewal).toBe(EMPTY_ACTIONS.renewal);
  });

  it("drops duplicate and non-string invoice numbers", () => {
    const read = normaliseActions({
      paidInvoices: ["INV-1", "INV-1", 7, null],
    });
    expect(read.paidInvoices).toEqual(["INV-1"]);
  });

  it("drops a change request with nothing in it", () => {
    const read = normaliseActions({
      changeRequests: [{ id: "a" }, { detail: "x" }, "nonsense"],
    });
    expect(read.changeRequests).toEqual([]);
  });

  it("repairs a request whose topic it does not recognise", () => {
    const read = normaliseActions({
      changeRequests: [{ id: "a", detail: "Please call", topic: "weather" }],
    });
    expect(read.changeRequests[0].topic).toBe("other");
  });

  it("refuses a renewal choice it does not recognise", () => {
    expect(normaliseActions({ renewal: "maybe" }).renewal).toBe(
      EMPTY_ACTIONS.renewal,
    );
  });
});
