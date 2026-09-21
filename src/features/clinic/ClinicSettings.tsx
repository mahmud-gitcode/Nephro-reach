"use client";

import React, { useRef, useState } from "react";
import {
  Activity,
  Building2,
  Download,
  FileLock2,
  KeyRound,
  Laptop,
  MoreHorizontal,
  Plus,
  Share2,
  ShieldCheck,
  Smartphone,
  Upload,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import { sidebarItems } from "@/components/layout/navigation";
import {
  Alert,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from "@/components/ui";
import { useLanguage, type LanguageCode } from "@/context/LanguageContext";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { tableIconButton } from "./tableButton";
import {
  DATE_FORMATS,
  initials,
  ITEMS_PER_PAGE,
  NOTIFICATIONS,
  officeUsers,
  TIME_ZONES,
  userStatusTone,
  validateProfile,
  type ClinicSettings,
  type OfficePreferences,
  type OrganizationProfile,
} from "./settings.data";
import { useClinicSettings } from "./useClinicSettings";

type Update = (change: Partial<ClinicSettings>) => void;

/* The landing page can be any screen in the clinic sidebar, so the list is
   read from the sidebar rather than copied — a page added there appears
   here without anyone remembering to. */
const LANDING_PAGES = sidebarItems.filter((item) =>
  item.roles?.includes("clinic"),
);

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "EN", label: "English (US)" },
  { code: "ES", label: "Español" },
];

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex items-start justify-between gap-inline-lg">
      <div className="min-w-0">
        <h2 className="text-heading-4 text-fg">{title}</h2>
        <p className="mt-stack-xs text-body-sm text-fg-muted">{description}</p>
      </div>
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
}: {
  icon: React.ReactNode;
  title: string;
  status?: React.ReactNode;
  action: React.ReactNode;
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
      </span>
      {action}
    </li>
  );
}

function OrganizationProfileCard({
  saved,
  update,
  emailRef,
  ready,
}: {
  saved: OrganizationProfile;
  update: Update;
  emailRef: React.RefObject<HTMLDivElement | null>;
  ready: boolean;
}) {
  /* Null until the first keystroke, so the form shows what is stored until
     someone actually edits it — no effect copying the saved record in. */
  const [draft, setDraft] = useState<OrganizationProfile | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = draft ?? saved;
  const dirty =
    draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const errors = attempted ? validateProfile(profile) : {};

  function edit(field: keyof OrganizationProfile, value: string) {
    setDraft({ ...profile, [field]: value });
    setJustSaved(false);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(validateProfile(profile)).length > 0) return;
    update({ profile });
    setDraft(null);
    setAttempted(false);
    setJustSaved(true);
  }

  function cancel() {
    setDraft(null);
    setAttempted(false);
  }

  /* Previewed in the browser only; the upload endpoint arrives with the
     backend, so a reload shows the stand-in again. */
  function chooseLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (logo) URL.revokeObjectURL(logo);
    setLogo(URL.createObjectURL(file));
    setLogoRemoved(false);
  }

  function removeLogo() {
    if (logo) URL.revokeObjectURL(logo);
    setLogo(null);
    setLogoRemoved(true);
  }

  return (
    <Card as="section" padding="small">
      {/* noValidate: the field errors below say what is wrong in words;
          the browser bubble would say it first, and differently. */}
      <form onSubmit={save} noValidate>
        <SectionHeading
          title="Organization Profile"
          description="Manage your organization information."
        />

        <div className="space-y-stack-md">
          <FormField label="Organization Name" required error={errors.name}>
            {(props) => (
              <Input
                {...props}
                inputSize="small"
                value={profile.name}
                onChange={(event) => edit("name", event.target.value)}
              />
            )}
          </FormField>
          <FormField label="Address">
            {(props) => (
              <Input
                {...props}
                inputSize="small"
                autoComplete="street-address"
                value={profile.address}
                onChange={(event) => edit("address", event.target.value)}
              />
            )}
          </FormField>
          <div className="grid gap-stack-md sm:grid-cols-2 xl:grid-cols-1">
            <FormField label="Phone">
              {(props) => (
                <Input
                  {...props}
                  type="tel"
                  inputSize="small"
                  autoComplete="tel"
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
                {TIME_ZONES.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </Select>
            )}
          </FormField>

          <div>
            <p className="text-label-lg text-fg">Logo</p>
            <div className="mt-stack-xs flex flex-wrap items-center gap-inline-lg">
              {logo ? (
                // A local object URL, which next/image cannot optimise.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt="Current logo"
                  className="h-16 w-16 rounded-control border border-line object-contain"
                />
              ) : logoRemoved ? (
                <span className="flex h-16 w-16 items-center justify-center rounded-control border border-dashed border-line-strong text-fg-muted">
                  <Building2 aria-hidden="true" className="h-6 w-6" />
                  <span className="sr-only">No logo</span>
                </span>
              ) : (
                <span
                  role="img"
                  aria-label="Current logo"
                  className="flex h-16 w-16 items-center justify-center rounded-control bg-surface-brand-subtle text-heading-4 text-brand-600"
                >
                  {initials(profile.name) || "?"}
                </span>
              )}
              <div className="flex flex-wrap gap-inline-md">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={chooseLogo}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <Button
                  type="button"
                  variant="neutral"
                  appearance="fill-stroke"
                  size="small"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Change Logo
                </Button>
                <Button
                  type="button"
                  variant="neutral"
                  appearance="stroke"
                  size="small"
                  disabled={logoRemoved}
                  onClick={removeLogo}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-stack-lg flex flex-wrap items-center gap-inline-md border-t border-line-subtle pt-inset-sm">
          <Button type="submit" size="small" disabled={!dirty || !ready}>
            Save Changes
          </Button>
          {dirty ? (
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

function UserManagementCard() {
  return (
    <Card as="section" padding="small" className="h-full">
      <SectionHeading
        title="User Management"
        description="Manage who has access to your office portal."
        action={
          <Button {...notBuiltYet("Adding a user")} size="small">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={640}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {officeUsers.map((user) => (
              <TableRow key={user.email}>
                <TableCell emphasis className="whitespace-nowrap">
                  {user.name}
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className="break-all">{user.email}</TableCell>
                <TableCell>
                  <Badge tone={userStatusTone[user.status]}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    {...notBuiltYet("User actions")}
                    variant="neutral"
                    appearance="fill-stroke"
                    size="small"
                    iconOnly
                    className={tableIconButton}
                    aria-label={`Actions for ${user.name}`}
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={1}
          pageCount={1}
          onPageChange={() => {}}
          summary={`Showing 1–${officeUsers.length} of ${officeUsers.length} users`}
        />
      </div>
    </Card>
  );
}

function NotificationCard({
  settings,
  update,
  onEditEmail,
}: {
  settings: ClinicSettings;
  update: Update;
  onEditEmail: () => void;
}) {
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <SectionHeading
        title="Notification Preferences"
        description="Choose what you want to be notified about."
      />

      {/* Each switch saves as it flips — that is what makes it a switch
          rather than a checkbox waiting on a Save button. */}
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
                checked={settings.notifications[item.id]}
                aria-labelledby={labelId}
                onChange={(checked) =>
                  update({
                    notifications: {
                      ...settings.notifications,
                      [item.id]: checked,
                    },
                  })
                }
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
            {settings.profile.email}
          </p>
        </div>
        {/* The address is the organization's email, so editing it means
            editing the profile — this takes you there rather than keeping
            a second copy that could disagree with it. */}
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

function SecurityCard() {
  return (
    <Card as="section" padding="small">
      <SectionHeading
        title="Security Settings"
        description="Keep your account secure."
      />
      <ul className="divide-y divide-line-subtle">
        <ActionRow
          icon={<KeyRound />}
          title="Change Password"
          action={<RowButton feature="Changing your password" label="Change" />}
        />
        <ActionRow
          icon={<Smartphone />}
          title="Two-Factor Authentication (2FA)"
          status={<Badge tone="neutral">Off</Badge>}
          action={
            <RowButton feature="Two-factor authentication" label="Enable" />
          }
        />
        <ActionRow
          icon={<Laptop />}
          title="Active Sessions"
          action={<RowButton feature="Active sessions" label="View" />}
        />
        <ActionRow
          icon={<Activity />}
          title="Login Activity"
          action={<RowButton feature="Login activity" label="View" />}
        />
      </ul>
    </Card>
  );
}

function RowButton({ feature, label }: { feature: string; label: string }) {
  return (
    <Button
      {...notBuiltYet(feature)}
      variant="neutral"
      appearance="fill-stroke"
      size="small"
      className="shrink-0"
    >
      {label}
    </Button>
  );
}

function OfficePreferencesCard({
  office,
  update,
}: {
  office: OfficePreferences;
  update: Update;
}) {
  const { language, setLanguage } = useLanguage();

  function set<K extends keyof OfficePreferences>(
    key: K,
    value: OfficePreferences[K],
  ) {
    update({ office: { ...office, [key]: value } });
  }

  return (
    <Card as="section" padding="small">
      <SectionHeading
        title="Office Preferences"
        description="Customize your portal experience."
      />
      <div className="space-y-stack-md">
        <FormField label="Default Landing Page">
          {(props) => (
            <Select
              {...props}
              selectSize="small"
              value={office.landingPage}
              onChange={(event) => set("landingPage", event.target.value)}
            >
              {LANDING_PAGES.map((page) => (
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
                set(
                  "itemsPerPage",
                  Number(
                    event.target.value,
                  ) as OfficePreferences["itemsPerPage"],
                )
              }
            >
              {ITEMS_PER_PAGE.map((count) => (
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
              onChange={(event) =>
                set(
                  "dateFormat",
                  event.target.value as OfficePreferences["dateFormat"],
                )
              }
            >
              {DATE_FORMATS.map((format) => (
                <option key={format}>{format}</option>
              ))}
            </Select>
          )}
        </FormField>
        {/* The app already has a language setting; this is it, not a copy
            that would disagree with the switcher in the header. */}
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

function DataPrivacyCard() {
  return (
    <Card as="section" padding="small">
      <SectionHeading
        title="Data & Privacy"
        description="Manage your data and compliance settings."
      />
      <div className="grid gap-inset-md lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ul className="divide-y divide-line-subtle">
          <ActionRow
            icon={<Download />}
            title="Download Your Data"
            action={
              <RowButton feature="Downloading your data" label="Download" />
            }
          />
          <ActionRow
            icon={<Share2 />}
            title="Data Sharing Preferences"
            action={<RowButton feature="Data sharing" label="Manage" />}
          />
          <ActionRow
            icon={<FileLock2 />}
            title="HIPAA & Security Information"
            action={
              <RowButton feature="HIPAA & security information" label="View" />
            }
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

export default function ClinicSettings() {
  const { settings, update, isPending, error, refetch, saveError } =
    useClinicSettings();
  const emailRef = useRef<HTMLDivElement>(null);

  function editEmail() {
    const input = emailRef.current?.querySelector("input");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }

  return (
    <div className="space-y-4">
      <PageTitle href="/dashboard/clinic/settings" />

      {error ? (
        <Alert
          tone="danger"
          title="Your saved settings could not be loaded."
          action={
            <Button size="small" variant="neutral" onClick={refetch}>
              Try again
            </Button>
          }
        >
          {error.message}
        </Alert>
      ) : null}
      {saveError ? (
        <Alert tone="danger" title="That change was not saved.">
          {saveError.message}
        </Alert>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <OrganizationProfileCard
          saved={settings.profile}
          update={update}
          emailRef={emailRef}
          ready={!isPending}
        />
        <div className="xl:col-span-2">
          <UserManagementCard />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <NotificationCard
          settings={settings}
          update={update}
          onEditEmail={editEmail}
        />
        <SecurityCard />
        <OfficePreferencesCard office={settings.office} update={update} />
      </section>

      <DataPrivacyCard />
    </div>
  );
}
