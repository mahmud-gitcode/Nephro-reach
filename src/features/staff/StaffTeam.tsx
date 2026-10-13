"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  KeyRound,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  FormField,
  Input,
  Modal,
  SearchField,
  Select,
  SwitchRow,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableThumb,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { nonStaffEmailsInUse } from "@/features/auth/auth";
import { roleNameError, useRolePermissions } from "./rolePermissions";
import {
  ALL,
  MIN_PASSWORD,
  PERMISSIONS,
  rolesForOrg,
  isCustomRole,
  portalRole,
  filterStaff,
  normalEmail,
  organization,
  organizationFor,
  defaultPermissions,
  effectivePermissions,
  portalPermissions,
  type Permission,
  staffError,
  type StaffAccount,
  type StaffDraft,
  type StaffError,
  type StaffRole,
} from "./staff";
import { useStaffAccounts } from "./useStaffAccounts";

/* ==========================================================================
   Staff & Roles — one organisation's people, and what each role may do
   --------------------------------------------------------------------------
   Each organisation manages its own staff (2026-09-30): the dialysis
   clinic from its Settings, the access center from its Staff & Roles page.
   The administrator adds a person with a role, can change the role, reset
   the password, or turn sign-in off; the record of who they were stays.

   Scoped to one organisation: its administrator never sees, nor adds to,
   another organisation's staff.
   ========================================================================== */

const ERROR_TEXT: Record<StaffError, string> = {
  name: "Enter the person's full name",
  email: "Enter a valid email address",
  "email-taken": "That email already has an account",
  organization: "Choose an organization",
  password: `At least ${MIN_PASSWORD} characters`,
};

/** A readable temporary password: two words and a number. */
function temporaryPassword() {
  const words = ["River", "Maple", "Harbor", "Summit", "Cedar", "Meadow"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}${pick()}${Math.floor(100 + Math.random() * 900)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** What a role may do, in plain words. */
function RoleSummary({ role, orgId }: { role: StaffRole; orgId: string }) {
  const portal = organization(orgId)?.portal ?? "clinic";
  const ids = effectivePermissions(role, portal, orgId);
  const allowed = PERMISSIONS.filter((p) => ids.includes(p.id));
  return (
    <section className="rounded-card-nested border border-line p-inset-sm">
      <h3 className="text-label-md text-fg">A {role} can</h3>
      <ul className="mt-stack-xs space-y-stack-xs">
        {allowed.map((permission) => (
          <li
            key={permission.id}
            className="flex items-start gap-inline-sm text-body-sm text-fg-secondary"
          >
            <Check
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-success"
            />
            {permission.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------- add staff */

function AddStaffModal({
  orgId,
  accounts,
  onAdd,
  onClose,
}: {
  orgId: string;
  accounts: StaffAccount[];
  onAdd: (draft: StaffDraft) => void;
  onClose: () => void;
}) {
  const org = organization(orgId);
  const roles = rolesForOrg(orgId);
  const [draft, setDraft] = useState<StaffDraft>({
    name: "",
    email: "",
    orgId,
    role: roles.includes("Nurse") ? "Nurse" : roles[0],
    password: temporaryPassword(),
  });
  const [tried, setTried] = useState(false);
  const set = (change: Partial<StaffDraft>) =>
    setDraft((d) => ({ ...d, ...change }));
  const taken = [
    ...nonStaffEmailsInUse(),
    ...accounts.map((account) => account.email),
  ];
  const error = staffError(draft, taken);
  const show = (fields: StaffError[]) =>
    tried && error && fields.includes(error) ? ERROR_TEXT[error] : undefined;

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title="Add Staff Member"
      description={`They sign in to ${org?.name ?? "your organization"} with this email and password.`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (error) return;
              onAdd(draft);
              onClose();
            }}
          >
            Create Account
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <FormField label="Full name" required error={show(["name"])}>
          {(field) => (
            <Input
              {...field}
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="E.g. Linda Moore, LMSW"
            />
          )}
        </FormField>
        <FormField
          label="Work email"
          required
          error={show(["email", "email-taken"])}
        >
          {(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="off"
              value={draft.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          )}
        </FormField>
        <FormField label="Role" required>
          {(field) => (
            <Select
              {...field}
              value={draft.role}
              onChange={(e) => set({ role: e.target.value as StaffRole })}
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          label="Temporary password"
          required
          error={show(["password"])}
          hint="Share it with them privately."
        >
          {(field) => (
            <div className="flex gap-inline-sm">
              <Input
                {...field}
                value={draft.password}
                onChange={(e) => set({ password: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => set({ password: temporaryPassword() })}
              >
                Generate
              </Button>
            </div>
          )}
        </FormField>
        <RoleSummary role={draft.role} orgId={orgId} />
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ edit staff */

function EditStaffModal({
  account,
  isSelf,
  onSave,
  onClose,
}: {
  account: StaffAccount;
  /** The administrator's own account: they cannot lock themselves out. */
  isSelf: boolean;
  onSave: (
    change: Partial<
      Pick<StaffAccount, "name" | "role" | "status" | "password">
    >,
  ) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(account.name);
  const portal = organization(account.orgId)?.portal;
  const roles = rolesForOrg(account.orgId);
  const [role, setRole] = useState<StaffRole>(
    portal && !isCustomRole(account.orgId, account.role)
      ? portalRole(account.role, portal)
      : account.role,
  );
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const active = account.status === "Active";
  const nameError = name.trim().length < 2 ? ERROR_TEXT.name : undefined;
  const passwordError =
    password && password.length < MIN_PASSWORD
      ? ERROR_TEXT.password
      : undefined;

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title={`Edit ${account.name}`}
      description={account.email}
      footer={
        <>
          {!isSelf ? (
            <Button
              variant={active ? "danger" : "neutral"}
              appearance="fill-stroke"
              className="mr-auto"
              onClick={() => {
                onSave({ status: active ? "Deactivated" : "Active" });
                onClose();
              }}
            >
              {active ? "Turn Off Sign-In" : "Turn On Sign-In"}
            </Button>
          ) : null}
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (nameError || passwordError) return;
              onSave({ name, role, ...(password ? { password } : {}) });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {!active ? (
          <Alert tone="warning">Sign-in is turned off for this account.</Alert>
        ) : null}
        <FormField
          label="Full name"
          required
          error={tried ? nameError : undefined}
        >
          {(field) => (
            <Input
              {...field}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </FormField>
        <FormField
          label="Role"
          required
          hint={isSelf ? "You cannot change your own role." : undefined}
        >
          {(field) => (
            <Select
              {...field}
              value={role}
              disabled={isSelf}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              {roles.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          label="Reset password"
          hint="Leave blank to keep the current one."
          error={tried ? passwordError : undefined}
        >
          {(field) => (
            <Input
              {...field}
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<KeyRound aria-hidden="true" />}
            />
          )}
        </FormField>
        <RoleSummary role={role} orgId={account.orgId} />
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------------------- roles */

type FeatureInfo = (typeof PERMISSIONS)[number];

function featuresFor(orgId: string): FeatureInfo[] {
  const portal = organization(orgId)?.portal ?? "clinic";
  return portalPermissions(portal)
    .map((id) => PERMISSIONS.find((p) => p.id === id))
    .filter((p): p is FeatureInfo => Boolean(p));
}

/** Name a new role, and start it blank or as a copy of another. */
function CreateRoleModal({
  orgId,
  onCreated,
  onClose,
}: {
  orgId: string;
  onCreated: (role: StaffRole) => void;
  onClose: () => void;
}) {
  const portal = organization(orgId)?.portal ?? "clinic";
  const saved = useRolePermissions();
  const roles = rolesForOrg(orgId);
  const [name, setName] = useState("");
  const [copyFrom, setCopyFrom] = useState<string>("");
  const [tried, setTried] = useState(false);
  const error = roleNameError(saved.store, orgId, portal, name);

  return (
    <Modal
      open
      onClose={onClose}
      title="Create a role"
      description="Name the role, then choose what it can do on the Roles tab."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (error) return;
              const start = copyFrom
                ? effectivePermissions(copyFrom as StaffRole, portal, orgId)
                : [];
              saved.create(orgId, name, start);
              onCreated(name.trim() as StaffRole);
              onClose();
            }}
          >
            Create role
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <FormField
          label="Role name"
          required
          error={
            tried && error
              ? error === "taken"
                ? "There is already a role with this name."
                : "Enter a name for the role."
              : undefined
          }
        >
          {(field) => (
            <Input
              {...field}
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Charge Nurse, Patient Navigator"
            />
          )}
        </FormField>
        <FormField
          label="Start from"
          hint="Copy another role's features, then adjust them."
        >
          {(field) => (
            <Select
              {...field}
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
            >
              <option value="">Nothing turned on</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  Copy of {r}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>
    </Modal>
  );
}

/** The Roles tab: every role, how many people hold it, and its features. */
function RolesPanel({
  orgId,
  accounts,
  canEdit,
}: {
  orgId: string;
  accounts: StaffAccount[];
  canEdit: boolean;
}) {
  const portal = organization(orgId)?.portal ?? "clinic";
  const saved = useRolePermissions();
  const roles = rolesForOrg(orgId);
  const features = featuresFor(orgId);
  const [selected, setSelected] = useState<StaffRole>(roles[0]);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const role = roles.includes(selected) ? selected : roles[0];
  const isCustom = isCustomRole(orgId, role);
  const custom = saved.store[orgId]?.permissions[role];
  const current = custom ?? defaultPermissions(role, portal);
  const holders = accounts.filter((a) => a.role === role).length;

  const toggle = (id: Permission, on: boolean) => {
    const next = on
      ? [...current, id]
      : current.filter((existing) => existing !== id);
    /* Kept in the list's own order, so a saved role reads the same way. */
    saved.set(
      orgId,
      role,
      features.map((p) => p.id).filter((p) => next.includes(p)),
    );
  };

  return (
    <div className="grid grid-cols-1 gap-inset-md p-card pt-0 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
      {/* The roles, each with how many people hold it. */}
      <div className="space-y-stack-sm">
        {canEdit ? (
          <Button
            fullWidth
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => setCreating(true)}
          >
            Create role
          </Button>
        ) : null}
        <ul className="space-y-stack-xs" aria-label="Roles">
          {roles.map((r) => {
            const count = accounts.filter((a) => a.role === r).length;
            const active = r === role;
            return (
              <li key={r}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelected(r);
                    setConfirmDelete(false);
                  }}
                  className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-inline-md rounded-card-nested border px-inset-sm py-inset-xs text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    active
                      ? "border-primary-soft-line bg-primary-soft"
                      : "border-line-subtle hover:bg-surface-sunken"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-label-md text-fg">{r}</span>
                    <span className="block text-caption text-fg-muted">
                      {isCustomRole(orgId, r) ? "Created by you" : "Built-in"}
                    </span>
                  </span>
                  <Badge tone="neutral">
                    {count} {count === 1 ? "person" : "people"}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The selected role's features. */}
      <section className="space-y-stack-md" aria-label={`${role} features`}>
        <div className="flex flex-wrap items-start justify-between gap-inline-md">
          <div>
            <h3 className="text-heading-5 text-fg">{role}</h3>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {canEdit
                ? "Turn each feature on or off for everyone with this role. It applies the next time they open a page."
                : "Only your organization's main account can change roles."}
            </p>
          </div>
          <span className="flex flex-wrap items-center gap-inline-sm">
            <Badge tone={custom && !isCustom ? "info" : "neutral"}>
              {isCustom ? "Custom role" : custom ? "Customized" : "Default"}
            </Badge>
            <Badge tone="neutral">
              {current.length} of {features.length} on
            </Badge>
            {canEdit && custom && !isCustom ? (
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => saved.set(orgId, role, null)}
              >
                Reset to default
              </Button>
            ) : null}
            {canEdit && isCustom ? (
              <Button
                size="small"
                variant="danger"
                appearance="fill-stroke"
                leadingIcon={<Trash2 aria-hidden="true" />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete role
              </Button>
            ) : null}
          </span>
        </div>

        {confirmDelete ? (
          holders > 0 ? (
            <Alert tone="warning" onDismiss={() => setConfirmDelete(false)}>
              {holders} {holders === 1 ? "person has" : "people have"} this
              role. Give them another role on the Staff tab first.
            </Alert>
          ) : (
            <Alert tone="danger" title={`Delete "${role}"?`}>
              <div className="mt-stack-sm flex flex-wrap gap-inline-sm">
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => {
                    saved.remove(orgId, role);
                    setSelected(roles[0]);
                    setConfirmDelete(false);
                  }}
                >
                  Yes, delete
                </Button>
                <Button
                  size="small"
                  variant="neutral"
                  appearance="fill-stroke"
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep it
                </Button>
              </div>
            </Alert>
          )
        ) : null}

        {saved.saveError ? (
          <Alert tone="danger">That change did not save. Try again.</Alert>
        ) : null}

        <ul className="space-y-stack-sm">
          {features.map((permission) => {
            const on = current.includes(permission.id);
            return (
              <li key={permission.id}>
                {canEdit ? (
                  <SwitchRow
                    checked={on}
                    onChange={(next) => toggle(permission.id, next)}
                    title={permission.label}
                    description={permission.detail}
                    disabled={saved.isSaving}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-inline-lg rounded-card border border-line-subtle p-inset-sm">
                    <span className="min-w-0">
                      <span className="block text-label-md text-fg">
                        {permission.label}
                      </span>
                      <span className="block text-body-sm text-fg-muted">
                        {permission.detail}
                      </span>
                    </span>
                    <Badge tone={on ? "success" : "neutral"}>
                      {on ? "On" : "Off"}
                    </Badge>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {creating ? (
        <CreateRoleModal
          orgId={orgId}
          onCreated={(created) => setSelected(created)}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ card */

type StaffTab = "staff" | "roles";

export function StaffTeamCard({
  orgId,
  title = "Staff & Roles",
}: {
  orgId: string;
  title?: string;
}) {
  const store = useStaffAccounts();
  /* Read so a role created a moment ago shows in every list here. */
  useRolePermissions();
  const { user } = useAuth();
  const [tab, setTab] = useState<StaffTab>("staff");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(ALL);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /* The organisation's main login: the only one who shapes roles. */
  const canEditRoles = !user?.staffRole && organizationFor(user)?.id === orgId;

  const mine = useMemo(
    () => store.accounts.filter((account) => account.orgId === orgId),
    [store.accounts, orgId],
  );
  const rows = useMemo(
    () => filterStaff(mine, { query, orgId, role }),
    [mine, query, orgId, role],
  );
  const active = mine.filter((a) => a.status === "Active").length;
  const editing = mine.find((a) => a.id === editingId) ?? null;

  if (store.error) {
    return (
      <ErrorState
        title="Staff could not be loaded"
        error={store.error}
        onRetry={store.refetch}
      />
    );
  }

  return (
    <Card as="section" padding="none" className="h-full overflow-hidden">
      <div className="space-y-stack-md p-card pb-stack-lg">
        <div className="flex flex-wrap items-start justify-between gap-inline-md">
          <div>
            <h2 className="text-heading-4 text-fg">{title}</h2>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {active} active · {mine.length - active} turned off ·{" "}
              {rolesForOrg(orgId).length} roles. Each person signs in as
              themselves.
            </p>
          </div>
          {tab === "staff" ? (
            <Button
              size="small"
              onClick={() => setAdding(true)}
              disabled={store.isPending}
              leadingIcon={<UserPlus aria-hidden="true" />}
            >
              Add Staff
            </Button>
          ) : null}
        </div>

        {/* Two jobs, two tabs (client, 2026-10-13): people on Staff, what
            each role may do on Roles. */}
        <Tabs<StaffTab>
          label="Staff and roles"
          value={tab}
          onChange={setTab}
          items={[
            {
              id: "staff",
              label: `Staff (${mine.length})`,
              icon: <Users aria-hidden="true" />,
            },
            {
              id: "roles",
              label: `Roles (${rolesForOrg(orgId).length})`,
              icon: <ShieldCheck aria-hidden="true" />,
            },
          ]}
        />

        {store.writeError ? (
          <Alert tone="danger" onDismiss={store.clearWriteError}>
            That change did not save. Try again.
          </Alert>
        ) : null}
        {notice ? (
          <Alert tone="success" onDismiss={() => setNotice(null)}>
            {notice}
          </Alert>
        ) : null}

        {tab === "staff" ? (
          <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center">
            <SearchField
              label="Search staff"
              placeholder="Search name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:w-64"
            />
            <Select
              selectSize="small"
              aria-label="Filter by role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value={ALL}>All roles</option>
              {rolesForOrg(orgId).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      <TabPanel id="staff" value={tab}>
        <Table minWidth={680}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Staff</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Sign-in</TableHeaderCell>
              <TableHeaderCell>Added</TableHeaderCell>
              <TableHeaderCell className="text-right">
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          {store.isPending ? (
            <TableSkeleton rows={4} columns={5} />
          ) : (
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  {mine.length === 0
                    ? "No staff yet. Add the first person who will work patients' records."
                    : "No staff match these filters."}
                </TableEmptyRow>
              ) : (
                rows.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell emphasis className="whitespace-nowrap">
                      <span className="flex items-center gap-inline-md">
                        <TableThumb name={account.name} />
                        <span>
                          {account.name}
                          {account.email === user?.email ? (
                            <span className="font-normal text-fg-muted">
                              {" "}
                              (you)
                            </span>
                          ) : null}
                          <span className="block text-caption font-normal text-fg-muted">
                            {account.email}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {account.role}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          account.status === "Active" ? "success" : "neutral"
                        }
                      >
                        {account.status === "Active" ? "Active" : "Turned off"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatDate(account.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-end">
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          onClick={() => setEditingId(account.id)}
                          leadingIcon={<Pencil aria-hidden="true" />}
                          aria-label={`Edit ${account.name}`}
                        >
                          Edit
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
      </TabPanel>

      <TabPanel id="roles" value={tab}>
        <RolesPanel orgId={orgId} accounts={mine} canEdit={canEditRoles} />
      </TabPanel>

      {adding ? (
        <AddStaffModal
          orgId={orgId}
          accounts={store.accounts}
          onClose={() => setAdding(false)}
          onAdd={(draft) => {
            store.add(draft);
            setNotice(
              `${draft.name.trim()} can now sign in as ${normalEmail(draft.email)} with the temporary password.`,
            );
          }}
        />
      ) : null}
      {editing ? (
        <EditStaffModal
          key={editing.id}
          account={editing}
          isSelf={editing.email === user?.email}
          onClose={() => setEditingId(null)}
          onSave={(change) => store.update(editing.id, change)}
        />
      ) : null}
    </Card>
  );
}
