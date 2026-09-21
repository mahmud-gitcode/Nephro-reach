import { describe, expect, it } from "vitest";
import { CONTRACT_SLOTS, enrolledCount } from "./enrollment.data";
import {
  contract,
  daysUntilEnd,
  invoicesUpTo,
  nextInvoiceDate,
  outstanding,
  paidThisMonthPct,
  patientsCovered,
  termElapsedPct,
  totalPaid,
} from "./billing.data";

const sept21 = new Date(2026, 8, 21);

describe("the contract matches the rest of the clinic portal", () => {
  it("covers the Enroll Patients roster against its seat count", () => {
    expect(patientsCovered).toBe(enrolledCount);
    expect(contract.patientsAllowed).toBe(CONTRACT_SLOTS);
  });

  it("is Sunshine's row from the mockup", () => {
    expect(contract).toMatchObject({
      number: "NR-2026-0125",
      monthlyFee: 1995,
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });
});

describe("invoices", () => {
  const invoices = invoicesUpTo(sept21);

  it("issues one a month from January through the current month", () => {
    expect(invoices).toHaveLength(9);
    expect(invoices[0].number).toBe("INV-2026-09");
    expect(invoices.at(-1)?.number).toBe("INV-2026-01");
  });

  it("dates January 1st locally, not as December 31st", () => {
    expect(invoices.at(-1)?.issued.getDate()).toBe(1);
    expect(invoices.at(-1)?.issued.getMonth()).toBe(0);
  });

  it("stops at the contract end", () => {
    expect(invoicesUpTo(new Date(2027, 5, 1))).toHaveLength(12);
  });

  it("totals nine months at the monthly fee, all paid", () => {
    expect(totalPaid(invoices)).toBe(9 * 1995);
    expect(outstanding(invoices)).toBe(0);
    expect(paidThisMonthPct(invoices, sept21)).toBe(100);
  });
});

describe("the term", () => {
  it("counts days to December 31st", () => {
    expect(daysUntilEnd(sept21)).toBe(101);
    expect(daysUntilEnd(new Date(2027, 0, 5))).toBe(0);
  });

  it("is about 72% through on September 21st", () => {
    expect(termElapsedPct(sept21)).toBe(72);
  });

  it("has a next invoice until December, then none", () => {
    expect(nextInvoiceDate(sept21)?.getMonth()).toBe(9);
    expect(nextInvoiceDate(new Date(2026, 11, 10))).toBeNull();
  });
});
