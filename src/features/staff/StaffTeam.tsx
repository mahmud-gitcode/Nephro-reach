"use client";

import React, { useMemo, useState } from "react";
import { Check, KeyRound, Pencil, ShieldCheck, UserPlus } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableThumb,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { nonStaffEmailsInUse } from "@/features/auth/auth";
import {
  ALL,
  MIN_PASSWORD,
  PERMISSIONS,
  STAFF_ROLES,
  filterStaff,
  normalEmail,
  organization,
  roleCan,
  staffError,
  type StaffAccount,
  type StaffDraft,
  type StaffError,
  type StaffRole,
} from "./staff";
import { useStaffAccounts } from "./useStaffAccounts";

/* ==========================================================================
   Staff & Roles — one organisation's people
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
  const portal = organization(orgId)?.portal;
  const allowed = PERMISSIONS.filter((p) => roleCan(role, p.id, portal));
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
  const [draft, setDraft] = useState<StaffDraft>({
    name: "",
    email: "",
    orgId,
    role: "Nurse",
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
              {STAFF_ROLES.map((role) => (
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
  const [role, setRole] = useState<StaffRole>(account.role);
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
              {STAFF_ROLES.map((option) => (
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

/* ----------------------------------------------------------- permissions */

function PermissionsModal({
  orgId,
  onClose,
}: {
  orgId: string;
  onClose: () => void;
}) {
  const portal = organization(orgId)?.portal;
  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title="Roles & Permissions"
      description="What each role may do in your organization's portal."
    >
      <div className="overflow-hidden rounded-card-nested border border-line">
        <Table minWidth={620}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Can</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {STAFF_ROLES.map((role) => (
              <TableRow key={role}>
                <TableCell emphasis className="align-top whitespace-nowrap">
                  {role}
                </TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-inline-xs">
                    {PERMISSIONS.filter((p) => roleCan(role, p.id, portal)).map(
                      (permission) => (
                        <Badge key={permission.id} tone="neutral">
                          {permission.label}
                        </Badge>
                      ),
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ card */

export function StaffTeamCard({
  orgId,
  title = "Staff & Roles",
}: {
  orgId: string;
  title?: string;
}) {
  const store = useStaffAccounts();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(ALL);
  const [adding, setAdding] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
              {active} active · {mine.length - active} turned off. Each person
              signs in as themselves.
            </p>
          </div>
          <div className="flex flex-wrap gap-inline-sm">
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setShowRoles(true)}
              leadingIcon={<ShieldCheck aria-hidden="true" />}
            >
              Roles &amp; Permissions
            </Button>
            <Button
              size="small"
              onClick={() => setAdding(true)}
              disabled={store.isPending}
              leadingIcon={<UserPlus aria-hidden="true" />}
            >
              Add Staff
            </Button>
          </div>
        </div>
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
            aria-label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value={ALL}>All roles</option>
            {STAFF_ROLES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </div>
      </div>

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
                      tone={account.status === "Active" ? "success" : "neutral"}
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
      {showRoles ? (
        <PermissionsModal orgId={orgId} onClose={() => setShowRoles(false)} />
      ) : null}
    </Card>
  );
}
