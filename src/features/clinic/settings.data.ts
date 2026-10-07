import { readJson, storageKey, writeJson } from "@/lib/data/storage";

/* ==========================================================================
   Clinic settings
   --------------------------------------------------------------------------
   What the office itself can change: its profile, which notifications it
   gets, and how the portal behaves for it. All three live under one key,
   because they are one record on the day there is an organization table.

   The user roster is here too but is not stored — nothing can add, edit or
   remove a user yet, so there is nothing to save. It is demo data as the
   client specified it.
   ========================================================================== */

export type OrganizationProfile = {
  name: string;
  address: string;
  phone: string;
  email: string;
  timeZone: string;
};

export const TIME_ZONES = [
  "(GMT-10:00) Hawaii Time (HT)",
  "(GMT-09:00) Alaska Time (AKT)",
  "(GMT-08:00) Pacific Time (PT)",
  "(GMT-07:00) Mountain Time (MT)",
  "(GMT-06:00) Central Time (CT)",
  "(GMT-05:00) Eastern Time (ET)",
] as const;

export const NOTIFICATIONS = [
  { id: "enrollments", label: "New member enrollments" },
  { id: "checkIns", label: "Patient check-in alerts" },
  { id: "liveClass", label: "Live class reminders" },
  { id: "billing", label: "Contract & billing updates" },
  { id: "announcements", label: "Platform announcements" },
  { id: "support", label: "Support ticket responses" },
  { id: "weeklySummary", label: "Weekly summary email" },
  { id: "sms", label: "SMS notifications", optional: true },
] as const;

export type NotificationId = (typeof NOTIFICATIONS)[number]["id"];

export const ITEMS_PER_PAGE = [10, 25, 50] as const;

export const DATE_FORMATS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const;

export type OfficePreferences = {
  /** A clinic route, e.g. "/dashboard/clinic". */
  landingPage: string;
  itemsPerPage: (typeof ITEMS_PER_PAGE)[number];
  dateFormat: (typeof DATE_FORMATS)[number];
  /* Office hours and on-call (client, 2026-10-07). Optional so settings
     saved before them still read; 8:00–17:00 until set. */
  /** "HH:MM", 24h. Messages outside these hours get the after-hours reply. */
  opensAt?: string;
  closesAt?: string;
  /** The on-call nurse manager's phone: with the server, an after-hours
   *  message unread for 2 hours sends an SMS alert here. */
  onCallPhone?: string;
};

export type ClinicSettings = {
  profile: OrganizationProfile;
  notifications: Record<NotificationId, boolean>;
  office: OfficePreferences;
};

export const defaultClinicSettings = (): ClinicSettings => ({
  profile: {
    name: "Riverside Dialysis Center",
    address: "123 Kidney Care Way, Columbia, SC 29201",
    phone: "(803) 555-0187",
    email: "mcarter@riversidedialysis.com",
    timeZone: "(GMT-05:00) Eastern Time (ET)",
  },
  /* Everything on except SMS, which the client marks optional — a text
     message is the one channel that can cost the recipient money. */
  notifications: {
    enrollments: true,
    checkIns: true,
    liveClass: true,
    billing: true,
    announcements: true,
    support: true,
    weeklySummary: true,
    sms: false,
  },
  office: {
    landingPage: "/dashboard/clinic",
    itemsPerPage: 10,
    dateFormat: "MM/DD/YYYY",
    opensAt: "08:00",
    closesAt: "17:00",
    onCallPhone: "",
  },
});

export type ProfileErrors = Partial<Record<keyof OrganizationProfile, string>>;

/** Only what would break something downstream: a nameless organization,
    or an address the notification emails cannot be sent to. */
export function validateProfile(profile: OrganizationProfile): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!profile.name.trim()) errors.name = "Enter the organization name.";
  if (!profile.email.trim()) errors.email = "Enter an email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    errors.email = "Enter an email address like name@clinic.com.";
  return errors;
}

/** "RD" for Riverside Dialysis Center — the stand-in logo. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

const KEY = storageKey("clinic-settings");

/* Merged section by section, so a record saved before a new notification
   or preference existed still reads back complete. */
export async function readClinicSettings(): Promise<ClinicSettings> {
  const stored = await readJson<Partial<ClinicSettings> | null>(KEY, null);
  const defaults = defaultClinicSettings();
  return {
    profile: { ...defaults.profile, ...stored?.profile },
    notifications: { ...defaults.notifications, ...stored?.notifications },
    office: { ...defaults.office, ...stored?.office },
  };
}

export async function writeClinicSettings(
  settings: ClinicSettings,
): Promise<ClinicSettings> {
  return writeJson(KEY, settings);
}
