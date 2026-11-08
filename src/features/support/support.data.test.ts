import { describe, expect, it } from "vitest";
import {
  dashboardFor,
  displayIdOf,
  fromApiInfoRequest,
  fromApiTicket,
  ticketError,
  ticketOrganizationFor,
} from "./support.data";

/* Support on the API (Phase 11): pure mapping and the form hint.
   Synthetic data only. */

const TICKET = {
  id: "0f1e2d3c-1111-4111-8111-111111111111",
  dashboard: "Hospital",
  organizationId: "org-h",
  organizationName: "Test Hospital",
  subject: "Cannot upload",
  category: "technical",
  message: "The upload fails.",
  status: "answered",
  createdAt: "2026-11-02T10:00:00.000Z",
  updatedAt: "2026-11-02T11:00:00.000Z",
  requester: { id: "u1", name: "Pat Staff", email: "pat@example.test" },
  replies: [
    {
      id: "r1",
      side: "support" as const,
      body: "Try again",
      at: "2026-11-02T10:30:00.000Z",
    },
    {
      id: "r2",
      side: "requester" as const,
      body: "Thanks",
      at: "2026-11-02T10:40:00.000Z",
    },
  ],
};

describe("support mapping", () => {
  it("shows the start of the server's id where SUP-1001 was", () => {
    expect(displayIdOf(TICKET.id)).toBe("0F1E2D3C");
    expect(fromApiTicket(TICKET).displayId).toBe("0F1E2D3C");
  });

  it("maps the platform view, with the requester named", () => {
    const t = fromApiTicket(TICKET);
    expect(t.status).toBe("answered");
    expect(t.from).toEqual({
      name: "Pat Staff",
      email: "pat@example.test",
      dashboard: "Hospital",
      organization: "Test Hospital",
    });
    expect(t.replies.map((r) => [r.by, r.name])).toEqual([
      ["support", ""],
      ["requester", "Pat Staff"],
    ]);
  });

  it("maps the requester's own view: no names at all", () => {
    const { requester: _unused, ...own } = TICKET;
    void _unused;
    const t = fromApiTicket(own);
    expect(t.from.name).toBe("");
    expect(t.from.email).toBe("");
    expect(t.replies[1].name).toBe("");
  });

  it("keeps unknown enum values inside the screen's lists", () => {
    const t = fromApiTicket({ ...TICKET, status: "weird", category: "x" });
    expect(t.status).toBe("open");
    expect(t.category).toBe("other");
  });

  it("maps an info request by its own id", () => {
    expect(
      fromApiInfoRequest({
        id: "i1",
        shareId: "s1",
        shareKind: "message",
        sharedByOrganizationName: null,
        name: "Pat",
        organization: "Outside Office",
        email: "pat@example.test",
        phone: "",
        at: "2026-11-02T10:00:00.000Z",
        contacted: false,
        contactedAt: null,
      }),
    ).toMatchObject({ id: "i1", contacted: false, sharedByOrganization: null });
  });
});

describe("which dashboard and office a ticket is sent for", () => {
  it("covers hospital staff and caregivers", () => {
    expect(dashboardFor("hospital")).toBe("Hospital");
    expect(dashboardFor("caregiver")).toBe("Patient");
    expect(dashboardFor("user")).toBe("Patient");
    expect(dashboardFor("clinic")).toBe("Dialysis Center");
    expect(dashboardFor("nephrology")).toBe("Nephrology Office");
    expect(dashboardFor("access")).toBe("Vascular Access Center");
    expect(dashboardFor("admin")).toBe("NephroReach Admin");
  });

  it("sends the office only in office mode", () => {
    expect(
      ticketOrganizationFor({ role: "hospital", organizationId: "o1" }),
    ).toBe("o1");
    expect(
      ticketOrganizationFor({ role: "user", organizationId: "o1" }),
    ).toBeUndefined();
    expect(
      ticketOrganizationFor({ role: "admin", organizationId: "p1" }),
    ).toBeUndefined();
  });
});

describe("ticketError", () => {
  it("asks for a subject and a message", () => {
    expect(ticketError({ subject: "Hi", message: "Hello there" })).toBe(
      "subject",
    );
    expect(ticketError({ subject: "Help", message: "Hey" })).toBe("message");
    expect(ticketError({ subject: "Help", message: "Hello there" })).toBeNull();
  });
});
