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
import { tableIconButton } from "./tableButton";
import {
  DATE_FORMATS,
  initials,
  ITEMS_PER_PAGE,
  NOTIFICATIONS,
  TIME_ZONES,
  userStatusTone,
  validateProfile,
  type ClinicSettings,
  type OfficePreferences,
  type OrganizationProfile,
} from "./settings.data";
import { useClinicSettings } from "./useClinicSettings";
import { useSettingsActions } from "./useSettingsActions";
import {
  exportDocument,
  exportFilename,
  type ManagedUser,
} from "./settings.actions";
import {
  AddUserModal,
  ChangePasswordModal,
  DataSharingModal,
  HipaaModal,
  LoginActivityModal,
  SessionsModal,
  TwoFactorModal,
  UserActionsModal,
} from "./SettingsModals";

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

/* Title and an optional action. The descriptions under these were removed
   at the client's instruction (2026-09-26) — a panel that says "Manage your
   organization information" above fields labelled Name, Address and Phone
   is repeating itself. */
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
        <SectionHeading title="Organization Profile" />

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

function UserManagementCard({
  users,
  onAdd,
  onSelect,
}: {
  users: ManagedUser[];
  onAdd: () => void;
  onSelect: (user: ManagedUser) => void;
}) {
  return (
    <Card as="section" padding="small" className="h-full">
      <SectionHeading
        title="User Management"
        action={
          <Button size="small" onClick={onAdd}>
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
            {users.map((user) => (
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
                    onClick={() => onSelect(user)}
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
          summary={`Showing 1–${users.length} of ${users.length} users`}
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
      <SectionHeading title="Notification Preferences" />

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

function SecurityCard({
  twoFactor,
  passwordChangedAt,
  onPassword,
  onTwoFactor,
  onSessions,
  onActivity,
}: {
  twoFactor: string | null;
  passwordChangedAt: string;
  onPassword: () => void;
  onTwoFactor: () => void;
  onSessions: () => void;
  onActivity: () => void;
}) {
  return (
    <Card as="section" padding="small">
      <SectionHeading title="Security Settings" />
      <ul className="divide-y divide-line-subtle">
        <ActionRow
          icon={<KeyRound />}
          title="Change Password"
          status={
            passwordChangedAt ? (
              <Badge tone="neutral">
                Changed {new Date(passwordChangedAt).toLocaleDateString()}
              </Badge>
            ) : null
          }
          action={<RowButton label="Change" onClick={onPassword} />}
        />
        <ActionRow
          icon={<Smartphone />}
          title="Two-Factor Authentication (2FA)"
          status={
            <Badge tone={twoFactor ? "success" : "neutral"}>
              {twoFactor === "app"
                ? "On — app"
                : twoFactor === "sms"
                  ? "On — SMS"
                  : "Off"}
            </Badge>
          }
          action={
            <RowButton
              label={twoFactor ? "Manage" : "Enable"}
              onClick={onTwoFactor}
            />
          }
        />
        <ActionRow
          icon={<Laptop />}
          title="Active Sessions"
          action={<RowButton label="View" onClick={onSessions} />}
        />
        <ActionRow
          icon={<Activity />}
          title="Login Activity"
          action={<RowButton label="View" onClick={onActivity} />}
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
      <SectionHeading title="Office Preferences" />
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

export default function ClinicSettings() {
  const { settings, update, isPending, error, refetch, saveError } =
    useClinicSettings();
  const emailRef = useRef<HTMLDivElement>(null);

  /* The roster, the security record and the sharing choices. Kept apart
     from the settings above so that adding a user does not rewrite the
     office's address. */
  const actions = useSettingsActions();

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [hipaaOpen, setHipaaOpen] = useState(false);

  /* A real file, built from what the browser already holds — the one action
     on this page that needs nothing from a server. */
  function downloadData() {
    const blob = new Blob([exportDocument(settings, actions.actions)], {
      type: "application/json",
    });
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
          <UserManagementCard
            users={actions.users}
            onAdd={() => setAddUserOpen(true)}
            onSelect={setSelectedUser}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <NotificationCard
          settings={settings}
          update={update}
          onEditEmail={editEmail}
        />
        <SecurityCard
          twoFactor={actions.security.twoFactor}
          passwordChangedAt={actions.security.passwordChangedAt}
          onPassword={() => setPasswordOpen(true)}
          onTwoFactor={() => setTwoFactorOpen(true)}
          onSessions={() => setSessionsOpen(true)}
          onActivity={() => setActivityOpen(true)}
        />
        <OfficePreferencesCard office={settings.office} update={update} />
      </section>

      <DataPrivacyCard
        onDownload={downloadData}
        onSharing={() => setSharingOpen(true)}
        onHipaa={() => setHipaaOpen(true)}
      />

      {/* The dialogs behind the actions above. Keyed on open where they hold
          a draft, so a reopened form starts clean. */}
      <AddUserModal
        key={`add-user-${addUserOpen}`}
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        users={actions.users}
        onAdd={actions.addUser}
      />

      <UserActionsModal
        user={selectedUser}
        users={actions.users}
        onClose={() => setSelectedUser(null)}
        onStatus={actions.setUserStatus}
        onResend={actions.resendInvite}
        onRemove={actions.removeUser}
      />

      <ChangePasswordModal
        key={`password-${passwordOpen}`}
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onChanged={actions.changePassword}
      />

      <TwoFactorModal
        key={`two-factor-${twoFactorOpen}`}
        open={twoFactorOpen}
        onClose={() => setTwoFactorOpen(false)}
        current={actions.security.twoFactor}
        onChoose={actions.setTwoFactor}
      />

      {sessionsOpen ? (
        <SessionsModal
          open
          onClose={() => setSessionsOpen(false)}
          signedOut={actions.security.signedOutSessions}
          onSignOut={actions.signOutSession}
        />
      ) : null}

      {activityOpen ? (
        <LoginActivityModal open onClose={() => setActivityOpen(false)} />
      ) : null}

      <DataSharingModal
        open={sharingOpen}
        onClose={() => setSharingOpen(false)}
        sharing={actions.sharing}
        onToggle={actions.setSharing}
      />

      <HipaaModal open={hipaaOpen} onClose={() => setHipaaOpen(false)} />
    </div>
  );
}
