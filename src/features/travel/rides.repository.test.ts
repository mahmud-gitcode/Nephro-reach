import { beforeEach, describe, expect, it } from "vitest";
import {
  createRide,
  deleteRide,
  listRides,
  updateRide,
} from "./rides.repository";
import { storageKey } from "@/lib/data/storage";

/* "Exactly one saved contact is primary" used to be re-derived in three
 * event handlers in the page, and delete got it wrong: it mutated the
 * array it had just filtered, so the promotion sometimes did not stick.
 * The rule lives in the repository now, and these tests are what hold it
 * there — they are about the invariant, not about localStorage. */

const KEY = storageKey("rides");
const seed = (rides: unknown) =>
  window.localStorage.setItem(KEY, JSON.stringify(rides));

describe("rides repository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("falls back to the seed list when nothing has been saved", async () => {
    expect(await listRides()).toHaveLength(1);
  });

  it("makes the first contact a member saves their primary one", async () => {
    seed([]);
    const rides = await createRide({
      name: "Ama",
      phone: "555-0100",
      isPrimary: false,
    });

    expect(rides).toHaveLength(1);
    expect(rides[0].isPrimary).toBe(true);
  });

  it("demotes the old primary when a new one is added", async () => {
    seed([{ id: "a", name: "Ama", phone: "1", isPrimary: true }]);
    const rides = await createRide({
      name: "Boni",
      phone: "2",
      isPrimary: true,
    });

    expect(rides.filter((ride) => ride.isPrimary)).toHaveLength(1);
    expect(rides.find((ride) => ride.isPrimary)?.name).toBe("Boni");
  });

  it("leaves the existing primary alone when the new contact is not one", async () => {
    seed([{ id: "a", name: "Ama", phone: "1", isPrimary: true }]);
    const rides = await createRide({ name: "Boni", phone: "2" });

    expect(rides.find((ride) => ride.isPrimary)?.name).toBe("Ama");
  });

  it("promotes someone when the primary contact is deleted", async () => {
    seed([
      { id: "a", name: "Ama", phone: "1", isPrimary: true },
      { id: "b", name: "Boni", phone: "2" },
    ]);
    const rides = await deleteRide("a");

    expect(rides).toHaveLength(1);
    expect(rides[0].isPrimary).toBe(true);
  });

  it("moves the primary flag when an edit sets it", async () => {
    seed([
      { id: "a", name: "Ama", phone: "1", isPrimary: true },
      { id: "b", name: "Boni", phone: "2" },
    ]);
    const rides = await updateRide("b", {
      name: "Boni",
      phone: "2",
      isPrimary: true,
    });

    expect(rides.filter((ride) => ride.isPrimary)).toHaveLength(1);
    expect(rides.find((ride) => ride.isPrimary)?.id).toBe("b");
  });

  it("never leaves a non-empty list without a primary", async () => {
    seed([
      { id: "a", name: "Ama", phone: "1", isPrimary: true },
      { id: "b", name: "Boni", phone: "2" },
    ]);
    // Un-ticking the box on the only primary would otherwise leave none.
    const rides = await updateRide("a", {
      name: "Ama",
      phone: "1",
      isPrimary: false,
    });

    expect(rides.filter((ride) => ride.isPrimary)).toHaveLength(1);
  });

  it("drops the legacy 'primary' note that duplicated the flag", async () => {
    seed([
      { id: "a", name: "Ama", phone: "1", isPrimary: true, note: "Primary" },
    ]);
    const rides = await listRides();

    expect(rides[0].note).toBeUndefined();
  });

  it("falls back to the seed list rather than crashing on a corrupt entry", async () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(await listRides()).toHaveLength(1);
  });
});
