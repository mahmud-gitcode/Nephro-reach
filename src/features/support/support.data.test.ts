import { describe, expect, it } from "vitest";
import {
  EMPTY_SUPPORT,
  openTicket,
  replyToTicket,
  setTicketStatus,
  ticketError,
  ticketsFrom,
  toggleContacted,
} from "./support.data";

const NOW = Date.parse("2026-10-07T15:00:00.000Z");
const from = {
  name: "Riverside Dialysis Center",
  email: "clinic@nephroreach.com",
  dashboard: "Dialysis Center",
};

describe("support tickets", () => {
  const opened = openTicket(
    EMPTY_SUPPORT,
    {
      subject: "Cannot upload labs",
      category: "technical",
      message: "The CSV upload fails.",
      from,
    },
    NOW,
  );
  const ticket = opened.tickets[0];

  it("opens a ticket the admin can see", () => {
    expect(ticket).toMatchObject({
      id: "SUP-1001",
      status: "open",
      subject: "Cannot upload labs",
    });
    expect(ticketsFrom(opened, "CLINIC@nephroreach.com")).toHaveLength(1);
    expect(ticketsFrom(opened, "someone@else.com")).toHaveLength(0);
  });

  it("is answered by support and reopened by the requester", () => {
    const answered = replyToTicket(
      opened,
      ticket.id,
      { by: "support", name: "NephroReach Support", body: "Try again now." },
      NOW + 1,
    );
    expect(answered.tickets[0].status).toBe("answered");
    const reopened = replyToTicket(
      answered,
      ticket.id,
      { by: "requester", name: from.name, body: "Still failing." },
      NOW + 2,
    );
    expect(reopened.tickets[0].status).toBe("open");
    expect(reopened.tickets[0].replies).toHaveLength(2);
  });

  it("ignores an empty reply", () => {
    expect(
      replyToTicket(
        opened,
        ticket.id,
        { by: "support", name: "S", body: "  " },
        NOW,
      ),
    ).toBe(opened);
  });

  it("can be resolved", () => {
    expect(
      setTicketStatus(opened, ticket.id, "resolved").tickets[0].status,
    ).toBe("resolved");
  });

  it("needs a subject and a message", () => {
    expect(ticketError({ subject: "", message: "Long enough" })).toBe(
      "subject",
    );
    expect(ticketError({ subject: "Subject", message: "" })).toBe("message");
    expect(
      ticketError({ subject: "Subject", message: "Long enough" }),
    ).toBeNull();
  });

  it("marks an organization request contacted, and back", () => {
    const once = toggleContacted(EMPTY_SUPPORT, "share-1|2026-10-06");
    expect(once.contacted).toEqual(["share-1|2026-10-06"]);
    expect(toggleContacted(once, "share-1|2026-10-06").contacted).toEqual([]);
  });
});
