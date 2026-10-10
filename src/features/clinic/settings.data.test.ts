import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultClinicSettings,
  initials,
  NOTIFICATIONS,
  readClinicSettings,
  validateProfile,
  writeClinicSettings,
} from "./settings.data";
import { organization } from "@/features/staff/staff";

beforeEach(() => {
  window.localStorage.clear();
});

describe("the defaults match what the client specified", () => {
  it("has every notification on except SMS", () => {
    const { notifications } = defaultClinicSettings();
    const off = NOTIFICATIONS.filter((item) => !notifications[item.id]);
    expect(off.map((item) => item.id)).toEqual(["sms"]);
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
    expect(initials("Riverside Dialysis Center")).toBe("RD");
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

describe("each office keeps its own settings", () => {
  const nephrology = organization("riverside-nephrology")!;

  it("starts the nephrology office from its own name and home page", async () => {
    const settings = await readClinicSettings(nephrology);
    expect(settings.profile.name).toBe("Riverside Nephrology Associates");
    expect(settings.office.landingPage).toBe("/dashboard/nephrology");
  });

  it("never overwrites the dialysis center's on-call phone", async () => {
    const clinic = defaultClinicSettings();
    clinic.office.onCallPhone = "(803) 555-0100";
    await writeClinicSettings(clinic);

    const office = defaultClinicSettings(nephrology);
    office.office.onCallPhone = "(803) 555-0199";
    await writeClinicSettings(office, nephrology);

    expect((await readClinicSettings()).office.onCallPhone).toBe(
      "(803) 555-0100",
    );
    expect((await readClinicSettings(nephrology)).office.onCallPhone).toBe(
      "(803) 555-0199",
    );
  });
});
