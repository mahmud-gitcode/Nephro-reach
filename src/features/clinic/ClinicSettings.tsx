"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Download,
  FileLock2,
  KeyRound,
  Laptop,
  Share2,
  ShieldCheck,
  Smartphone,
  Upload,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import { sidebarItems } from "@/components/layout/navigation";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Select,
  Skeleton,
  Switch,
} from "@/components/ui";
import { useLanguage, type LanguageCode } from "@/context/LanguageContext";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import {
  DATE_FORMATS,
  displayPhone,
  initials,
  ITEMS_PER_PAGE,
  NOTIFICATIONS,
  profilePatch,
  SHARING_FIELD,
  TIME_ZONES,
  timeZoneLabel,
  toE164,
  validateProfile,
  type ClinicSettings as Settings,
  type NotificationId,
  type OfficePreferences,
  type OrganizationProfile,
  type ProfilePatch,
  type SettingsPatch,
} from "./settings.data";
import { useClinicSettings } from "./useClinicSettings";
import { useStaffAccounts } from "@/features/staff/useStaffAccounts";
import { useAuth } from "@/features/auth/AuthContext";
import type { UserRole } from "@/features/auth/auth";
import { exportDocument, exportFilename } from "./settings.actions";
import { actionErrorText } from "./officeContext";
import { DataSharingModal, HipaaModal } from "./SettingsModals";

/* ==========================================================================
   Office Settings (Phase 14)
   --------------------------------------------------------------------------
   The office's profile and settings from the API (useClinicSettings). Each
   card saves only its own changed fields: a switch saves as it flips, the
   profile on Save. The name is NephroReach's and read-only here; the time
   zone is stored as an IANA id. Password, sessions and login activity are
   the account's own flows, which are not built for offices yet, so those
   rows are shown but not available; two-factor opens the account's own
   two-factor page. The logo has no server field yet (INT-16).
   ========================================================================== */

const NOT_AVAILABLE = "Not available yet";

/* The landing page can be any screen in the office's own sidebar, so the
   list is read from the sidebar rather than copied. */
function landingPagesFor(portal: UserRole) {
  return sidebarItems.filter((item) => item.roles?.includes(portal));
}

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "EN", label: "English (US)" },
  { code: "ES", label: "Español" },
];

/* Title and an optional action (descriptions removed at the client's
   instruction, 2026-09-26). */
function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex items-center justify-between gap-inline-lg">
      <h2 className="min-w-0 text-heading-4 text-fg">{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Icon, title and one action — the shape of every row in the security and
    data sections. */
function ActionRow({
  icon,
  title,
  status,
  action,
  note,
  noteId,
}: {
  icon: React.ReactNode;
  title: string;
  status?: React.ReactNode;
  action: React.ReactNode;
  note?: string;
  noteId?: string;
}) {
  return (
    <li className="flex items-center gap-inline-lg py-inset-sm first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-fg-secondary [&_svg]:h-4 [&_svg]:w-4"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-inline-md">
        <span className="text-label-lg text-fg">{title}</span>
        {status}
        {note ? (
          <span id={noteId} className="w-full text-caption text-fg-muted">
            {note}
          </span>
        ) : null}
      </span>
      {action}
    </li>
  );
}

function OrganizationProfileCard({
  saved,
  onSave,
  saving,
  emailRef,
}: {
  saved: OrganizationProfile;
  onSave: (patch: ProfilePatch, done: () => void) => void;
  saving: boolean;
  emailRef: React.RefObject<HTMLDivElement | null>;
}) {
  /* Null until the first keystroke, so the form shows what is stored until
     someone actually edits it. */
  const [draft, setDraft] = useState<OrganizationProfile | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const profile = draft ?? saved;
  const patch = draft ? profilePatch(saved, draft) : {};
  const dirty = Object.keys(patch).length > 0;
  const errors = attempted ? validateProfile(profile) : {};
  const knownZone = TIME_ZONES.some((zone) => zone.iana === profile.timeZone);

  function edit(field: keyof OrganizationProfile, value: string) {
    setDraft({ ...profile, [field]: value });
    setJustSaved(false);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(validateProfile(profile)).length > 0 || !dirty) return;
    onSave(patch, () => {
      setDraft(null);
      setAttempted(false);
      setJustSaved(true);
    });
  }

  function cancel() {
    setDraft(null);
    setAttempted(false);
  }

  return (
    <Card as="section" padding="small">
      {/* noValidate: the field errors below say what is wrong in words. */}
      <form onSubmit={save} noValidate>
        <SectionHeading title="Organization Profile" />

        <div className="space-y-stack-md">
          <FormField
            label="Organization Name"
            hint="Only NephroReach can change the organization name."
          >
            {(props) => (
              <Input
                {...props}
                inputSize="small"
                value={profile.name}
                readOnly
                disabled
              />
            )}
          </FormField>
          <FormField label="Address" error={errors.address}>
            {(props) => (
              <Input
                {...props}
                inputSize="small"
                autoComplete="street-address"
                maxLength={300}
                value={profile.address}
                onChange={(event) => edit("address", event.target.value)}
              />
            )}
          </FormField>
          <div className="grid gap-stack-md sm:grid-cols-2 xl:grid-cols-1">
            <FormField label="Phone" error={errors.phone}>
              {(props) => (
                <Input
                  {...props}
                  type="tel"
                  inputSize="small"
                  autoComplete="tel"
                  maxLength={40}
                  value={profile.phone}
                  onChange={(event) => edit("phone", event.target.value)}
                />
              )}
            </FormField>
            <div ref={emailRef}>
              <FormField label="Email" required error={errors.email}>
                {(props) => (
                  <Input
                    {...props}
                    type="email"
                    inputSize="small"
                    autoComplete="email"
                    value={profile.email}
                    onChange={(event) => edit("email", event.target.value)}
                  />
                )}
              </FormField>
            </div>
          </div>
          <FormField label="Time Zone">
            {(props) => (
              <Select
                {...props}
                selectSize="small"
                value={profile.timeZone}
                onChange={(event) => edit("timeZone", event.target.value)}
              >
                {knownZone ? null : (
                  <option value={profile.timeZone}>
                    {timeZoneLabel(profile.timeZone)}
                  </option>
                )}
                {TIME_ZONES.map((zone) => (
                  <option key={zone.iana} value={zone.iana}>
                    {zone.label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <div>
            <p className="text-label-lg text-fg">Logo</p>
            <div className="mt-stack-xs flex flex-wrap items-center gap-inline-lg">
              <span
                role="img"
                aria-label="Current logo"
                className="flex h-16 w-16 items-center justify-center rounded-control bg-surface-brand-subtle text-heading-4 text-brand-600"
              >
                {initials(profile.name) || "?"}
              </span>
              {/* No server field for a logo yet (INT-16): shown, disabled,
                  explained; nothing is uploaded or kept. */}
              <div className="flex flex-wrap gap-inline-md">
                <Button
                  type="button"
                  variant="neutral"
                  appearance="fill-stroke"
                  size="small"
                  disabled
                  title={NOT_AVAILABLE}
                  aria-describedby="logo-not-available"
                >
                  <Upload className="h-4 w-4" />
                  Change Logo
                </Button>
                <Button
                  type="button"
                  variant="neutral"
                  appearance="stroke"
                  size="small"
                  disabled
                  title={NOT_AVAILABLE}
                  aria-describedby="logo-not-available"
                >
                  Remove
                </Button>
              </div>
              <p
                id="logo-not-available"
                className="w-full text-caption text-fg-muted"
              >
                {NOT_AVAILABLE}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-stack-lg flex flex-wrap items-center gap-inline-md border-t border-line-subtle pt-inset-sm">
          <Button type="submit" size="small" disabled={!dirty || saving}>
            Save Changes
          </Button>
          {draft !== null ? (
            <Button
              type="button"
              variant="neutral"
              appearance="stroke"
              size="small"
              onClick={cancel}
            >
              Cancel
            </Button>
          ) : null}
          <p role="status" className="text-body-sm text-fg-muted">
            {justSaved && !dirty ? "Changes saved." : ""}
          </p>
        </div>
      </form>
    </Card>
  );
}

function NotificationCard({
  settings,
  onToggle,
  onEditEmail,
}: {
  settings: Settings;
  onToggle: (id: NotificationId, on: boolean) => void;
  onEditEmail: () => void;
}) {
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <SectionHeading title="Notification Preferences" />

      {/* Each switch saves as it flips, and only that toggle is sent. */}
      <ul className="divide-y divide-line-subtle">
        {NOTIFICATIONS.map((item) => {
          const labelId = `notify-${item.id}`;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-inline-lg py-inset-xs"
            >
              <span id={labelId} className="text-body-sm text-fg">
                {item.label}
                {"optional" in item ? (
                  <span className="text-fg-muted"> (optional)</span>
                ) : null}
              </span>
              <Switch
                size="small"
                checked={settings.notifications[item.id] ?? false}
                aria-labelledby={labelId}
                onChange={(checked) => onToggle(item.id, checked)}
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex items-end justify-between gap-inline-lg border-t border-line-subtle pt-inset-sm">
        <div className="min-w-0">
          <p className="text-body-sm text-fg-muted">
            Email notifications will be sent to:
          </p>
          <p className="text-label-md break-all text-fg">
            {settings.profile.email || "—"}
          </p>
        </div>
        {/* The address is the organization's email: Edit takes you to the
            profile field rather than keeping a second copy. */}
        <Button
          type="button"
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          onClick={onEditEmail}
        >
          Edit
        </Button>
      </div>
    </Card>
  );
}

function SecurityCard({
  mfaEnabled,
  mfaHref,
}: {
  mfaEnabled: boolean;
  mfaHref: string;
}) {
  const disabledButton = (label: string, noteId: string) => (
    <Button
      variant="neutral"
      appearance="fill-stroke"
      size="small"
      className="shrink-0"
      disabled
      title={NOT_AVAILABLE}
      aria-describedby={noteId}
    >
      {label}
    </Button>
  );
  return (
    <Card as="section" padding="small">
      <SectionHeading title="Security Settings" />
      <ul className="divide-y divide-line-subtle">
        <ActionRow
          icon={<KeyRound />}
          title="Change Password"
          note={NOT_AVAILABLE}
          noteId="security-password-na"
          action={disabledButton("Change", "security-password-na")}
        />
        <ActionRow
          icon={<Smartphone />}
          title="Two-Factor Authentication (2FA)"
          status={
            <Badge tone={mfaEnabled ? "success" : "neutral"}>
              {mfaEnabled ? "On" : "Off"}
            </Badge>
          }
          action={
            <Link
              href={mfaHref}
              className={buttonStyles({
                variant: "neutral",
                appearance: "fill-stroke",
                size: "small",
              })}
            >
              {mfaEnabled ? "Manage" : "Enable"}
            </Link>
          }
        />
        <ActionRow
          icon={<Laptop />}
          title="Active Sessions"
          note={NOT_AVAILABLE}
          noteId="security-sessions-na"
          action={disabledButton("View", "security-sessions-na")}
        />
        <ActionRow
          icon={<Activity />}
          title="Login Activity"
          note={NOT_AVAILABLE}
          noteId="security-activity-na"
          action={disabledButton("View", "security-activity-na")}
        />
      </ul>
    </Card>
  );
}

function RowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="neutral"
      appearance="fill-stroke"
      size="small"
      className="shrink-0"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function OfficePreferencesCard({
  office,
  onChange,
  landingPages,
}: {
  office: OfficePreferences;
  onChange: (patch: SettingsPatch) => void;
  landingPages: ReturnType<typeof landingPagesFor>;
}) {
  const { language, setLanguage } = useLanguage();
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const shownPhone = phone ?? displayPhone(office.onCallPhone);
  const itemCounts: number[] = ITEMS_PER_PAGE.includes(
    office.itemsPerPage as (typeof ITEMS_PER_PAGE)[number],
  )
    ? [...ITEMS_PER_PAGE]
    : [office.itemsPerPage, ...ITEMS_PER_PAGE];
  const knownLanding = landingPages.some(
    (page) => page.href === office.landingPage,
  );

  function savePhone() {
    if (phone === null) return;
    const e164 = toE164(phone);
    if (e164 === undefined) {
      setPhoneError("Enter a phone number like (803) 555-0100.");
      return;
    }
    setPhoneError("");
    if (e164 !== (office.onCallPhone || null)) onChange({ onCallPhone: e164 });
    setPhone(null);
  }

  return (
    <Card as="section" padding="small">
      <SectionHeading title="Office Preferences" />
      <div className="space-y-stack-md">
        <FormField label="Default Landing Page">
          {(props) => (
            <Select
              {...props}
              selectSize="small"
              value={office.landingPage}
              onChange={(event) =>
                onChange({ landingPage: event.target.value || null })
              }
            >
              {knownLanding ? null : (
                <option value={office.landingPage}>
                  {office.landingPage || "Not set"}
                </option>
              )}
              {landingPages.map((page) => (
                <option key={page.href} value={page.href}>
                  {page.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Items Per Page">
          {(props) => (
            <Select
              {...props}
              selectSize="small"
              value={String(office.itemsPerPage)}
              onChange={(event) =>
                onChange({ itemsPerPage: Number(event.target.value) })
              }
            >
              {itemCounts.map((count) => (
                <option key={count}>{count}</option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Date Format">
          {(props) => (
            <Select
              {...props}
              selectSize="small"
              value={office.dateFormat}
              onChange={(event) => onChange({ dateFormat: event.target.value })}
            >
              {DATE_FORMATS.map((format) => (
                <option key={format}>{format}</option>
              ))}
            </Select>
          )}
        </FormField>
        {/* Office hours and on-call (client, 2026-10-07). */}
        <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
          <FormField label="Office Opens">
            {(props) => (
              <Input
                {...props}
                type="time"
                inputSize="small"
                value={office.opensAt}
                onChange={(event) =>
                  event.target.value &&
                  onChange({ opensAt: event.target.value })
                }
              />
            )}
          </FormField>
          <FormField label="Office Closes">
            {(props) => (
              <Input
                {...props}
                type="time"
                inputSize="small"
                value={office.closesAt}
                onChange={(event) =>
                  event.target.value &&
                  onChange({ closesAt: event.target.value })
                }
              />
            )}
          </FormField>
        </div>
        <p className="text-caption text-fg-muted">
          Patients who message outside these hours get an automatic reply
          telling them when the team reviews messages and to call 911 in an
          emergency.
        </p>
        <FormField
          label="On-Call Nurse Manager Phone"
          error={phoneError || undefined}
          hint="If an after-hours message is still unread, NephroReach alerts this number. Saved when you leave the field."
        >
          {(props) => (
            <Input
              {...props}
              type="tel"
              inputSize="small"
              value={shownPhone}
              placeholder="(803) 555-0100"
              onChange={(event) => setPhone(event.target.value)}
              onBlur={savePhone}
            />
          )}
        </FormField>
        {/* The app's own language setting, not a copy of it. */}
        <FormField label="Language">
          {(props) => (
            <Select
              {...props}
              selectSize="small"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as LanguageCode)
              }
            >
              {LANGUAGES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>
    </Card>
  );
}

function DataPrivacyCard({
  onDownload,
  onSharing,
  onHipaa,
}: {
  onDownload: () => void;
  onSharing: () => void;
  onHipaa: () => void;
}) {
  return (
    <Card as="section" padding="small">
      <SectionHeading title="Data & Privacy" />
      <div className="grid gap-inset-md lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ul className="divide-y divide-line-subtle">
          <ActionRow
            icon={<Download />}
            title="Download Your Data"
            action={<RowButton label="Download" onClick={onDownload} />}
          />
          <ActionRow
            icon={<Share2 />}
            title="Data Sharing Preferences"
            action={<RowButton label="Manage" onClick={onSharing} />}
          />
          <ActionRow
            icon={<FileLock2 />}
            title="HIPAA & Security Information"
            action={<RowButton label="View" onClick={onHipaa} />}
          />
        </ul>
        <Alert
          tone="success"
          live={false}
          icon={<ShieldCheck />}
          title="Your data is secure."
          className="self-start"
        >
          NephroReach uses industry-standard security measures to protect your
          information.
        </Alert>
      </div>
    </Card>
  );
}

export default function ClinicSettings({
  href = "/dashboard/clinic/settings",
}: {
  /** The office's own Settings entry: the dialysis center's, or the
   *  nephrology office's (client, 2026-10-09). */
  href?: string;
}) {
  const office = useClinicSettings();
  const settings = office.settings;
  const emailRef = useRef<HTMLDivElement>(null);
  const staff = useStaffAccounts();
  const { user, context } = useAuth();

  const [sharingOpen, setSharingOpen] = useState(false);
  const [hipaaOpen, setHipaaOpen] = useState(false);

  /* A file built from what the page read from the API: the office's
     profile and settings and its staff (no patient data, no secret). */
  function downloadData() {
    if (!settings) return;
    const blob = new Blob(
      [exportDocument(settings, new Date(), staff.accounts)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFilename();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Freed on the next tick: revoking synchronously can beat the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function editEmail() {
    const input = emailRef.current?.querySelector("input");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }

  return (
    <div className="space-y-4">
      <PageTitle href={href} />

      {office.saveError ? (
        <Alert
          tone="danger"
          title="That change was not saved."
          action={
            <Button
              size="small"
              variant="neutral"
              onClick={office.dismissSaveError}
            >
              Dismiss
            </Button>
          }
        >
          {actionErrorText(office.saveError)}
        </Alert>
      ) : null}

      <AsyncSection
        pending={office.isPending}
        error={office.error}
        errorTitle={errorTitleFor(
          office.error,
          "Your saved settings could not be loaded.",
        )}
        errorMessage={errorMessageFor(office.error, undefined)}
        onRetry={canRetry(office.error) ? office.refetch : undefined}
        skeleton={<Skeleton height={480} className="rounded-card" />}
      >
        {settings ? (
          <>
            {/* Staff moved to its own menu, Staff & Roles (2026-09-30), so
                the settings are three to a row. */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <OrganizationProfileCard
                saved={settings.profile}
                saving={office.isSaving}
                onSave={(patch, done) =>
                  office.updateProfile(patch, { onSuccess: done })
                }
                emailRef={emailRef}
              />
              <NotificationCard
                settings={settings}
                onToggle={(id, on) =>
                  office.updateSettings({ notifications: { [id]: on } })
                }
                onEditEmail={editEmail}
              />
              <SecurityCard
                mfaEnabled={context?.user.mfaEnabled ?? false}
                mfaHref={`/setup/mfa?next=${encodeURIComponent(href)}`}
              />
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <OfficePreferencesCard
                office={settings.office}
                onChange={office.updateSettings}
                landingPages={landingPagesFor(user?.role ?? "clinic")}
              />
              <div className="xl:col-span-2">
                <DataPrivacyCard
                  onDownload={downloadData}
                  onSharing={() => setSharingOpen(true)}
                  onHipaa={() => setHipaaOpen(true)}
                />
              </div>
            </section>

            <DataSharingModal
              open={sharingOpen}
              onClose={() => setSharingOpen(false)}
              sharing={settings.sharing}
              onToggle={(id, on) =>
                office.updateSettings({ [SHARING_FIELD[id]]: on })
              }
            />
          </>
        ) : null}
      </AsyncSection>

      <HipaaModal open={hipaaOpen} onClose={() => setHipaaOpen(false)} />
    </div>
  );
}
