import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultClinicSettings,
  initials,
  NOTIFICATIONS,
  officeUsers,
  readClinicSettings,
  validateProfile,
  writeClinicSettings,
} from "./settings.data";

beforeEach(() => {
  window.localStorage.clear();
});

describe("the defaults match what the client specified", () => {
  it("has every notification on except SMS", () => {
    const { notifications } = defaultClinicSettings();
    const off = NOTIFICATIONS.filter((item) => !notifications[item.id]);
    expect(off.map((item) => item.id)).toEqual(["sms"]);
  });

  it("lists five users, one of them pending", () => {
    expect(officeUsers).toHaveLength(5);
    expect(officeUsers.filter((u) => u.status === "Pending")).toHaveLength(1);
  });
});

describe("validating the organization profile", () => {
  it("accepts the specified profile", () => {
    expect(validateProfile(defaultClinicSettings().profile)).toEqual({});
  });

  it("needs a name and a usable email", () => {
    const profile = defaultClinicSettings().profile;
    expect(validateProfile({ ...profile, name: "  " }).name).toBeDefined();
    expect(validateProfile({ ...profile, email: "" }).email).toBeDefined();
    expect(
      validateProfile({ ...profile, email: "mcarter@" }).email,
    ).toBeDefined();
  });
});

describe("the stand-in logo", () => {
  it("takes the first two words", () => {
    expect(initials("Sunshine Nephrology Associates")).toBe("SN");
  });

  it("skips words that do not start with a letter", () => {
    expect(initials("& Kidney Care")).toBe("KC");
  });
});

describe("storage", () => {
  it("starts from the defaults", async () => {
    expect(await readClinicSettings()).toEqual(defaultClinicSettings());
  });

  it("reads back what was written", async () => {
    const settings = defaultClinicSettings();
    settings.notifications.sms = true;
    settings.office.itemsPerPage = 25;
    await writeClinicSettings(settings);
    expect(await readClinicSettings()).toEqual(settings);
  });

  it("fills in a notification an older record is missing", async () => {
    window.localStorage.setItem(
      "nr:clinic-settings",
      JSON.stringify({ notifications: { billing: false } }),
    );
    const settings = await readClinicSettings();
    expect(settings.notifications.billing).toBe(false);
    expect(settings.notifications.weeklySummary).toBe(true);
    expect(settings.profile).toEqual(defaultClinicSettings().profile);
  });
});
