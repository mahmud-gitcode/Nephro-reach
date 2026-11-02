"use client";

import React, { useMemo, useState } from "react";
import { Plus, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import {
  canLevel,
  editorResources,
} from "@/features/permissions/permissionMap";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import * as api from "@/features/staff/staff.api";
import {
  useAdminContext,
  useRoles,
  useStaffAdmin,
} from "@/features/staff/useStaffAccounts";
import { adminErrorText } from "@/features/staff/staffErrors";
import {
  LEVELS,
  LEVEL_NAMES,
  SENSITIVE_RESOURCES,
  changedResources,
  mapLevel,
  permissionsBody,
  resourceLabel,
  roleNameProblem,
  selectableLevels,
  withinReach,
} from "./roles";

/* ==========================================================================
   Roles and permissions: the resource × level editor (Phase 3, D4)
   --------------------------------------------------------------------------
   Each role of this organisation is a map of resource → None / View /
   Edit / Manage, read from and written to the server
   (`GET/POST/PUT/DELETE /organizations/{id}/roles`). Levels above the
   editor's own are disabled (the server's canGrant refuses them anyway);
   prescriptions, sensitive clinical actions and staff administration are
   their own resources. Saving signs out everyone who holds the role
   (spec 025 §3), and the editor says so before saving. Any refusal from
   the server is shown as it came.
   ========================================================================== */

function originLabel(role: api.OrgRole): string {
  if (role.isCustom) return "Custom";
  return role.isOverridden ? "Built-in, changed" : "Built-in";
}

export function RoleEditor() {
  const { permissions: mine } = useAdminContext();
  const canRead = canLevel(mine, "roles", 1);
  const canManage = canLevel(mine, "roles", 3);
  const roles = useRoles(canRead);
  const admin = useStaffAdmin();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number> | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<api.OrgRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const role = roles.roles.find((r) => r.name === selected) ?? roles.roles[0];
  const original = useMemo(() => role?.permissions ?? {}, [role]);
  const edited = draft ?? original;
  const resources = useMemo(
    () =>
      editorResources(
        mine?.kind ?? "office",
        roles.roles.flatMap((r) => [
          ...Object.keys(r.permissions),
          ...Object.keys(r.defaultPermissions ?? {}),
        ]),
      ),
    [mine?.kind, roles.roles],
  );
  const changes = changedResources(original, edited);
  const reachable = withinReach(mine, original, edited);

  if (!canRead) {
    return (
      <EmptyState
        icon={<ShieldAlert />}
        title="Roles are not available to you"
        description="Your role can't view this organization's roles. Ask an administrator."
        variant="bare"
      />
    );
  }
  if (roles.error) {
    return (
      <ErrorState
        title={errorTitleFor(roles.error, "Roles could not be loaded")}
        message={errorMessageFor(roles.error, undefined)}
        onRetry={canRetry(roles.error) ? roles.refetch : undefined}
      />
    );
  }
  if (roles.isPending || !role) return <Skeleton height={320} />;

  const pick = (name: string) => {
    setSelected(name);
    setDraft(null);
    setError(null);
    setNotice(null);
  };

  const save = async () => {
    setConfirming(false);
    setError(null);
    try {
      await admin.run((orgId) =>
        api.setRolePermissions(
          orgId,
          role.name,
          permissionsBody(resources, edited, original),
        ),
      );
      setDraft(null);
      setNotice(`${role.name} saved. Everyone with this role was signed out.`);
    } catch (cause) {
      setError(adminErrorText(cause));
    }
  };

  return (
    <div className="space-y-stack-md p-card">
      {error ? (
        <Alert tone="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-inline-md">
        <FormField label="Role" className="min-w-60 flex-1">
          {(field) => (
            <Select
              {...field}
              value={role.name}
              onChange={(e) => pick(e.target.value)}
            >
              {roles.roles.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.memberCount})
                </option>
              ))}
            </Select>
          )}
        </FormField>
        {canManage ? (
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Plus />}
            onClick={() => setCreating(true)}
          >
            New role
          </Button>
        ) : null}
        {canManage && (role.isCustom || role.isOverridden) ? (
          <Button
            size="small"
            variant="danger"
            appearance="fill-stroke"
            leadingIcon={role.isCustom ? <Trash2 /> : <RotateCcw />}
            onClick={() => setRemoving(role)}
          >
            {role.isCustom ? "Delete role" : "Reset to default"}
          </Button>
        ) : null}
      </div>

      <p className="text-body-sm text-fg-muted">
        {originLabel(role)} · {role.memberCount}{" "}
        {role.memberCount === 1 ? "person" : "people"} ·{" "}
        {canManage
          ? "Levels above your own can't be granted."
          : "View only: your role can't change roles."}
      </p>

      <Table minWidth={520}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Area</TableHeaderCell>
            <TableHeaderCell>Level</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resources.map((resource) => {
            const current = mapLevel(original, resource);
            const value = mapLevel(edited, resource);
            const options = selectableLevels(mine, resource, current);
            return (
              <TableRow key={resource}>
                <TableCell emphasis>
                  <span className="inline-flex flex-wrap items-center gap-inline-sm">
                    {resourceLabel(resource)}
                    {SENSITIVE_RESOURCES.includes(resource) ? (
                      <Badge tone="warning">Separate permission</Badge>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell>
                  <Select
                    aria-label={`${resourceLabel(resource)} level`}
                    className="w-40"
                    value={String(value)}
                    disabled={
                      !canManage ||
                      options.filter((o) => !o.disabled).length <= 1
                    }
                    onChange={(e) =>
                      setDraft({
                        ...edited,
                        [resource]: Number(e.target.value),
                      })
                    }
                  >
                    {LEVELS.map((level) => (
                      <option
                        key={level}
                        value={level}
                        disabled={
                          options.find((o) => o.level === level)?.disabled
                        }
                      >
                        {LEVEL_NAMES[level]}
                      </option>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {canManage ? (
        <div className="flex flex-wrap items-center justify-end gap-inline-sm">
          {changes.length > 0 ? (
            <p className="mr-auto text-body-sm text-fg-muted">
              {changes.length} change{changes.length === 1 ? "" : "s"} not saved
            </p>
          ) : null}
          <Button
            variant="neutral"
            appearance="fill-stroke"
            disabled={changes.length === 0}
            onClick={() => setDraft(null)}
          >
            Discard
          </Button>
          <Button
            disabled={changes.length === 0 || admin.isSaving}
            onClick={() => setConfirming(true)}
          >
            Save role
          </Button>
        </div>
      ) : null}

      {confirming ? (
        <Modal
          open
          size="small"
          onClose={() => setConfirming(false)}
          title={`Save ${role.name}?`}
          description={`${role.memberCount} ${role.memberCount === 1 ? "person" : "people"} with this role will be signed out and sign in again with the new access.`}
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => void save()}>Save and sign out</Button>
            </>
          }
        >
          {!reachable ? (
            <Alert tone="warning" live={false}>
              Some of these levels are above your own. The server will refuse
              them.
            </Alert>
          ) : null}
          <ul className="space-y-stack-xs text-body-sm">
            {changes.map((r) => (
              <li key={r}>
                {resourceLabel(r)}: {LEVEL_NAMES[mapLevel(original, r) as 0]} →{" "}
                {LEVEL_NAMES[mapLevel(edited, r) as 0]}
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {creating ? (
        <CreateRoleModal
          taken={roles.roles.map((r) => r.name)}
          onClose={() => setCreating(false)}
          onCreate={async (name) => {
            await admin.run((orgId) => api.createRole(orgId, name, {}));
            pick(name);
          }}
        />
      ) : null}

      {removing ? (
        <Modal
          open
          size="small"
          onClose={() => setRemoving(null)}
          title={
            removing.isCustom
              ? `Delete ${removing.name}?`
              : `Reset ${removing.name} to its default?`
          }
          description={
            removing.isCustom
              ? "A role that anyone holds, or that a waiting invitation names, can't be deleted."
              : "Its levels go back to the built-in default. Everyone with this role will be signed out."
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setRemoving(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  const target = removing;
                  setRemoving(null);
                  setError(null);
                  try {
                    await admin.run((orgId) =>
                      api.deleteOrResetRole(orgId, target.name),
                    );
                    pick(
                      target.isCustom
                        ? (roles.roles[0]?.name ?? "")
                        : target.name,
                    );
                  } catch (cause) {
                    setError(adminErrorText(cause));
                  }
                }}
              >
                {removing.isCustom ? "Delete role" : "Reset role"}
              </Button>
            </>
          }
        />
      ) : null}
    </div>
  );
}

function CreateRoleModal({
  taken,
  onCreate,
  onClose,
}: {
  taken: string[];
  onCreate: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const problem = roleNameProblem(name, taken);
  const text =
    problem === "empty"
      ? "Enter a name."
      : problem === "long"
        ? "At most 60 characters."
        : problem === "taken"
          ? "That name is already used."
          : undefined;
  return (
    <Modal
      open
      size="small"
      onClose={onClose}
      title="New role"
      description="It starts with no access. Set its levels after creating it."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={async () => {
              setTried(true);
              if (problem) return;
              setSaving(true);
              setError(null);
              try {
                await onCreate(name.trim());
                onClose();
              } catch (cause) {
                setError(adminErrorText(cause));
              } finally {
                setSaving(false);
              }
            }}
          >
            Create role
          </Button>
        </>
      }
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <FormField label="Role name" required error={tried ? text : undefined}>
        {(field) => (
          <Input
            {...field}
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </FormField>
    </Modal>
  );
}
