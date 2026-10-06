import { describe, expect, it } from "vitest";
import {
  createShare,
  recordDownload,
  recordOpened,
  requestInfo,
  shareByToken,
  shareStatus,
  sharesForPatient,
  verifyRecipient,
} from "./shares";

const NOW = new Date(2026, 9, 6, 12).getTime();

const made = createShare(
  { shares: [] },
  {
    patientName: "John Taylor",
    kind: "document",
    recipientEmail: "  Coordinator@Lakeside.org ",
    recipientOrg: "Lakeside Transplant Center",
    subject: "My latest labs",
    body: "Attached are my labs from this week.",
    attachment: {
      name: "labs.pdf",
      type: "application/pdf",
      dataUrl: "data:application/pdf;base64,AAA",
    },
  },
  "tok123",
  NOW,
);
const share = made.shares[0];

describe("Share Outside NephroReach", () => {
  it("creates a share with a link token and a content-free notice", () => {
    expect(shareByToken(made, "tok123")?.id).toBe(share.id);
    expect(share.recipientEmail).toBe("coordinator@lakeside.org");
    expect(share.log.map((l) => l.event)).toEqual(["shared", "notified"]);
    expect(shareStatus(share)).toBe("sent");
    expect(sharesForPatient(made, "John Taylor")).toHaveLength(1);
    expect(sharesForPatient(made, "Someone Else")).toEqual([]);
  });

  it("shows the item only to the address it was sent to", () => {
    const opened = recordOpened(made, share.id, NOW + 1);
    expect(shareStatus(opened.shares[0])).toBe("opened");
    expect(
      verifyRecipient(
        opened,
        share.id,
        { email: "other@x.org", name: "A", organization: "B" },
        NOW + 2,
      ),
    ).toBeNull();
    const ok = verifyRecipient(
      opened,
      share.id,
      {
        email: "COORDINATOR@lakeside.org",
        name: "Dana Lee",
        organization: "Lakeside",
      },
      NOW + 2,
    )!;
    expect(ok.shares[0].verifiedBy?.name).toBe("Dana Lee");
    expect(shareStatus(ok.shares[0])).toBe("viewed");
  });

  it("logs downloads and requests for information", () => {
    let s = recordDownload(made, share.id, NOW + 3);
    s = requestInfo(
      s,
      share.id,
      {
        name: "Dana Lee",
        organization: "Lakeside",
        email: "d@l.org",
        phone: "",
      },
      NOW + 4,
    );
    expect(s.shares[0].infoRequests).toHaveLength(1);
    expect(s.shares[0].log.map((l) => l.event).slice(-2)).toEqual([
      "downloaded",
      "info-requested",
    ]);
  });
});
