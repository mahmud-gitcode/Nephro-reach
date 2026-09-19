import { describe, expect, it } from "vitest";
import {
  applyDecision,
  approvedPosts,
  buildHeldItem,
  decidedItems,
  pendingCount,
  pendingItems,
  visibleHeldReplies,
  withoutHeldItem,
} from "./moderationQueue.rules";
import type { HeldItem } from "./community.types";

/* The queue behind the community board. The board used to let "Die already"
 * post straight to a patient's milestone; these rules are what holds it
 * instead, and what a moderator's decision does to it afterwards. */

const held = (patch: Partial<HeldItem> = {}): HeldItem => ({
  id: "h1",
  kind: "reply",
  postId: "p1",
  author: "Charles D. Xavier",
  content: "Die already",
  reason: "harassment",
  matchedPhrase: "die already",
  status: "pending",
  submittedAt: "2026-09-19T10:00:00.000Z",
  ...patch,
});

const now = new Date("2026-09-19T12:00:00.000Z");

describe("buildHeldItem", () => {
  it("holds the reply that used to post", () => {
    const item = buildHeldItem(
      {
        kind: "reply",
        postId: "p1",
        author: "Charles",
        content: "Die already",
      },
      "h-new",
      now,
    );

    expect(item).not.toBeNull();
    expect(item?.status).toBe("pending");
    expect(item?.reason).toBe("harassment");
    // The phrase is recorded so the queue can be audited and tuned.
    expect(item?.matchedPhrase).toBe("die already");
    expect(item?.submittedAt).toBe(now.toISOString());
  });

  it("refuses to queue something that was never flagged", () => {
    // A queue only a human can clear has to stay short enough to read.
    expect(
      buildHeldItem(
        {
          kind: "reply",
          postId: "p1",
          author: "Charles",
          content: "Congratulations on your transplant!",
        },
        "h-new",
        now,
      ),
    ).toBeNull();
  });

  it("drops the postId on a held post, which replies to nothing", () => {
    const item = buildHeldItem(
      { kind: "post", postId: "p1", author: "C", content: "you are pathetic" },
      "h-new",
      now,
    );
    expect(item?.postId).toBe("");
  });

  it("trims the content it stores", () => {
    const item = buildHeldItem(
      { kind: "reply", postId: "p1", author: "C", content: "  Die already  " },
      "h-new",
      now,
    );
    expect(item?.content).toBe("Die already");
  });
});

describe("a moderator's decision", () => {
  it("records approval and when it happened", () => {
    const [item] = applyDecision([held()], "h1", "approved", now);
    expect(item.status).toBe("approved");
    expect(item.decidedAt).toBe(now.toISOString());
  });

  it("records a rejection", () => {
    const [item] = applyDecision([held()], "h1", "rejected", now);
    expect(item.status).toBe("rejected");
  });

  it("leaves other items alone", () => {
    const items = [held(), held({ id: "h2" })];
    const next = applyDecision(items, "h1", "approved", now);
    expect(next[1].status).toBe("pending");
  });

  it("deletes a record outright", () => {
    expect(withoutHeldItem([held(), held({ id: "h2" })], "h1")).toHaveLength(1);
  });
});

describe("working the queue", () => {
  it("lists pending oldest first, so it does not reshuffle underneath", () => {
    const items = [
      held({ id: "late", submittedAt: "2026-09-19T11:00:00.000Z" }),
      held({ id: "early", submittedAt: "2026-09-19T09:00:00.000Z" }),
      held({ id: "done", status: "approved" }),
    ];
    expect(pendingItems(items).map((item) => item.id)).toEqual([
      "early",
      "late",
    ]);
  });

  it("lists decided newest first", () => {
    const items = [
      held({
        id: "older",
        status: "approved",
        decidedAt: "2026-09-19T10:00:00.000Z",
      }),
      held({
        id: "newer",
        status: "rejected",
        decidedAt: "2026-09-19T11:00:00.000Z",
      }),
    ];
    expect(decidedItems(items).map((item) => item.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("counts only what is still waiting", () => {
    expect(pendingCount([held(), held({ id: "h2", status: "approved" })])).toBe(
      1,
    );
  });
});

describe("who can see a held reply", () => {
  it("shows a pending reply to its author and nobody else", () => {
    // The whole point of holding it: the member it was aimed at must not
    // read it while it waits.
    const items = [held({ author: "Charles" })];
    expect(visibleHeldReplies(items, "p1", "Charles")).toHaveLength(1);
    expect(visibleHeldReplies(items, "p1", "Maria")).toHaveLength(0);
  });

  it("hides a rejected reply from everyone but its author", () => {
    const items = [held({ author: "Charles", status: "rejected" })];
    expect(visibleHeldReplies(items, "p1", "Maria")).toHaveLength(0);
    expect(visibleHeldReplies(items, "p1", "Charles")).toHaveLength(1);
  });

  it("shows an approved reply to everyone, because it is on the board", () => {
    const items = [held({ author: "Charles", status: "approved" })];
    expect(visibleHeldReplies(items, "p1", "Maria")).toHaveLength(1);
  });

  it("does not leak a reply onto a different post", () => {
    const items = [held({ postId: "p1", author: "Charles" })];
    expect(visibleHeldReplies(items, "p2", "Charles")).toHaveLength(0);
  });

  it("never returns a held post from the reply list", () => {
    const items = [held({ kind: "post", postId: "", status: "approved" })];
    expect(visibleHeldReplies(items, "", "Charles")).toHaveLength(0);
  });
});

describe("approved posts rejoining the feed", () => {
  it("returns only approved posts", () => {
    const items = [
      held({ id: "a", kind: "post", postId: "", status: "approved" }),
      held({ id: "b", kind: "post", postId: "", status: "pending" }),
      held({ id: "c", kind: "reply", status: "approved" }),
    ];
    expect(approvedPosts(items).map((item) => item.id)).toEqual(["a"]);
  });
});
