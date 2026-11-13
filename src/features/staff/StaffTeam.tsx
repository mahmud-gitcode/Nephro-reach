"use client";

import React, { useMemo, useState } from "react";
import {
  Crown,
  Mail,
  Pencil,
  RotateCw,
  ShieldCheck,
  UserMinus,
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
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
  TableSkeleton,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { useLanguageCode } from "@/context/LanguageContext";
import type { Pagination } from "@/lib/api/client";
import { canLevel } from "@/features/permissions/permissionMap";
import { RoleEditor } from "@/features/roles/RoleEditor";
import { assignableRoles } from "@/features/roles/roles";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import * as api from "./staff.api";
import { adminErrorText } from "./staffErrors";
import {
  useAdminContext,
  useRoles,
  useStaffAdmin,
  useStaffInvitations,
  useStaffList,
} from "./useStaffAccounts";

/* ==========================================================================
   Staff and roles: one organisation's people and access (Phase 3, D3, D4)
   --------------------------------------------------------------------------
   Everything comes from and goes to the API for the office (or platform
   team) the user is working in. Each button shows only when the server's
   levels for this membership allow it (list: staff View; title: staff
   Edit; invite, resend, revoke, role change, deactivate: staff Manage;
   ownership: the owner), and the server checks again.

   D3: no one sets a password for someone else. A person registers their
   own account, then accepts an invitation sent to that email. An invitation
   works once, expires, and can be withdrawn or resent.
   D2: changing someone's role or turning their sign-in off ends their
   sessions; the screen says so before it happens.
   ========================================================================== */

type StaffTab = "people" | "invitations" | "roles";
const PAGE = 25;

/** Page count and total from an offset page (the staff routes page by
 *  number); a cursor page has neither. */
function offsetMeta(
  p: Pagination | null,
): { total: number; pages: number } | null {
  return p && p.mode === "offset"
    ? { total: p.total, pages: Math.max(1, p.totalPages) }
    : null;
}

function formatDate(iso: string | null, isEs = false) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_TONE: Record<
  string,
  "success" | "warning" | "neutral" | "danger"
> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "neutral",
  REVOKED: "neutral",
  EXPIRED: "danger",
};
const STATUS_TEXT: Record<string, { en: string; es: string }> = {
  PENDING: { en: "Waiting", es: "Pendiente" },
  ACCEPTED: { en: "Accepted", es: "Aceptada" },
  DECLINED: { en: "Declined", es: "Rechazada" },
  REVOKED: { en: "Withdrawn", es: "Retirada" },
  EXPIRED: { en: "Expired", es: "Vencida" },
};

export function StaffTeamCard({
  title: titleProp,
}: {
  /** Kept for the pages that pass it; the office is the active context. */
  orgId?: string;
  title?: string;
}) {
  const isEs = useLanguageCode() === "ES";
  const title = titleProp ?? (isEs ? "Personal y roles" : "Staff & Roles");
  const { orgId, permissions } = useAdminContext();
  const [tab, setTab] = useState<StaffTab>("people");
  const canInvite = canLevel(permissions, "staff", 3);

  if (!orgId) {
    return (
      <ErrorState
        title={isEs ? "Primero abra un consultorio" : "Open an office first"}
        message={
          isEs
            ? "La gestión del personal funciona dentro de un consultorio o del portal del equipo de NephroReach."
            : "Staff management works inside an office or the NephroReach team portal."
        }
      />
    );
  }

  return (
    <Card as="section" padding="none" className="h-full overflow-hidden">
      <div className="space-y-stack-md p-card pb-stack-lg">
        <div>
          <h2 className="text-heading-4 text-fg">{title}</h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {isEs ? (
              "Cada persona inicia sesión con su propia cuenta. Usted invita a su correo electrónico y la persona acepta con él."
            ) : (
              <>
                Each person signs in with their own account. You invite their
                email; they accept with it.
              </>
            )}
          </p>
        </div>
        <Tabs<StaffTab>
          label={isEs ? "Personal y roles" : "Staff and roles"}
          value={tab}
          onChange={setTab}
          items={[
            {
              id: "people",
              label: isEs ? "Personas" : "People",
              icon: <Users />,
            },
            {
              id: "invitations",
              label: isEs ? "Invitaciones" : "Invitations",
              icon: <Mail />,
            },
            {
              id: "roles",
              label: isEs ? "Roles y permisos" : "Roles & permissions",
              icon: <ShieldCheck />,
            },
          ]}
        />
      </div>
      <TabPanel id="people" value={tab}>
        <PeoplePanel />
      </TabPanel>
      <TabPanel id="invitations" value={tab}>
        <InvitationsPanel canInvite={canInvite} />
      </TabPanel>
      <TabPanel id="roles" value={tab}>
        <RoleEditor />
      </TabPanel>
    </Card>
  );
}

/* --------------------------------------------------------------- people */

type RowAction =
  | { kind: "role"; member: api.StaffMember }
  | { kind: "title"; member: api.StaffMember }
  | { kind: "status"; member: api.StaffMember }
  | { kind: "owner"; member: api.StaffMember };

function PeoplePanel() {
  const isEs = useLanguageCode() === "ES";
  const { permissions, isOwner, membershipUserId } = useAdminContext();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const list = useStaffList({ page, limit: PAGE, search });
  const admin = useStaffAdmin();
  const [action, setAction] = useState<RowAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canTitle = canLevel(permissions, "staff", 2);
  const canManage = canLevel(permissions, "staff", 3);
  const meta = offsetMeta(list.pagination);
  const pageCount = meta?.pages ?? 1;

  if (list.error) {
    return (
      <div className="p-card">
        <ErrorState
          title={errorTitleFor(
            list.error,
            isEs ? "El personal no se cargó" : "Staff could not be loaded",
            isEs ? "es" : "en",
          )}
          message={errorMessageFor(list.error, undefined, isEs ? "es" : "en")}
          onRetry={canRetry(list.error) ? list.refetch : undefined}
        />
      </div>
    );
  }

  const run = async (
    work: (orgId: string) => Promise<unknown>,
    endsOwnSession = false,
  ) => {
    setError(null);
    try {
      await admin.run(work, endsOwnSession);
      setAction(null);
    } catch (cause) {
      setError(adminErrorText(cause, isEs));
    }
  };

  return (
    <div>
      <div className="space-y-stack-sm px-card pb-stack-md">
        {error ? (
          <Alert tone="danger" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        <SearchField
          label={
            isEs
              ? "Buscar personal por nombre o correo electrónico"
              : "Search staff by name or email"
          }
          placeholder={
            isEs
              ? "Buscar por nombre o correo electrónico"
              : "Search by name or email"
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <Table minWidth={720}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{isEs ? "Persona" : "Person"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Rol" : "Role"}</TableHeaderCell>
            <TableHeaderCell>
              {isEs ? "Inicio de sesión" : "Sign-in"}
            </TableHeaderCell>
            <TableHeaderCell>{isEs ? "Agregado" : "Added"}</TableHeaderCell>
            <TableHeaderCell className="text-right">
              {isEs ? "Acciones" : "Actions"}
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        {list.isPending ? (
          <TableSkeleton rows={4} columns={5} />
        ) : (
          <TableBody>
            {list.rows.length === 0 ? (
              <TableEmptyRow colSpan={5}>
                {search
                  ? isEs
                    ? "Nadie coincide con esa búsqueda."
                    : "No one matches that search."
                  : isEs
                    ? "Todavía no hay personal."
                    : "No staff yet."}
              </TableEmptyRow>
            ) : (
              list.rows.map((m) => {
                const self = m.userId === membershipUserId;
                const active = m.status === "ACTIVE";
                return (
                  <TableRow key={m.id}>
                    <TableCell emphasis>
                      <span className="block">{m.name ?? m.email ?? "—"}</span>
                      <span className="block text-caption text-fg-muted">
                        {m.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block">
                        {m.isOwner ? (isEs ? "Propietario" : "Owner") : m.role}
                      </span>
                      {m.title ? (
                        <span className="block text-caption text-fg-muted">
                          {m.title}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge tone={active ? "success" : "neutral"}>
                        {active
                          ? isEs
                            ? "Activo"
                            : "Active"
                          : isEs
                            ? "Desactivado"
                            : "Turned off"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(m.createdAt, isEs)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-inline-xs">
                        {canTitle ? (
                          <Button
                            size="small"
                            variant="neutral"
                            appearance="ghost"
                            leadingIcon={<Pencil />}
                            aria-label={
                              isEs
                                ? `Cambiar el cargo de ${m.name ?? m.email}`
                                : `Change title of ${m.name ?? m.email}`
                            }
                            onClick={() =>
                              setAction({ kind: "title", member: m })
                            }
                          >
                            {isEs ? "Cargo" : "Title"}
                          </Button>
                        ) : null}
                        {canManage && !m.isOwner && !self ? (
                          <>
                            <Button
                              size="small"
                              variant="neutral"
                              appearance="ghost"
                              aria-label={
                                isEs
                                  ? `Cambiar el rol de ${m.name ?? m.email}`
                                  : `Change role of ${m.name ?? m.email}`
                              }
                              onClick={() =>
                                setAction({ kind: "role", member: m })
                              }
                            >
                              {isEs ? "Rol" : "Role"}
                            </Button>
                            <Button
                              size="small"
                              variant={active ? "danger" : "neutral"}
                              appearance="ghost"
                              leadingIcon={
                                active ? <UserMinus /> : <RotateCw />
                              }
                              aria-label={
                                isEs
                                  ? `${active ? "Desactivar" : "Activar"} el inicio de sesión de ${m.name ?? m.email}`
                                  : `${active ? "Turn off" : "Turn on"} sign-in for ${m.name ?? m.email}`
                              }
                              onClick={() =>
                                setAction({ kind: "status", member: m })
                              }
                            >
                              {active
                                ? isEs
                                  ? "Desactivar"
                                  : "Turn off"
                                : isEs
                                  ? "Activar"
                                  : "Turn on"}
                            </Button>
                          </>
                        ) : null}
                        {isOwner && !m.isOwner && active ? (
                          <Button
                            size="small"
                            variant="neutral"
                            appearance="ghost"
                            leadingIcon={<Crown />}
                            aria-label={
                              isEs
                                ? `Hacer propietario a ${m.name ?? m.email}`
                                : `Make ${m.name ?? m.email} the owner`
                            }
                            onClick={() =>
                              setAction({ kind: "owner", member: m })
                            }
                          >
                            {isEs ? "Hacer propietario" : "Make owner"}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        )}
      </Table>
      <TablePagination
        page={page}
        pageCount={Math.max(1, pageCount)}
        onPageChange={setPage}
        summary={
          meta
            ? isEs
              ? `${meta.total} ${meta.total === 1 ? "persona" : "personas"}`
              : `${meta.total} ${meta.total === 1 ? "person" : "people"}`
            : undefined
        }
      />

      {action?.kind === "title" ? (
        <TitleModal
          member={action.member}
          saving={admin.isSaving}
          onClose={() => setAction(null)}
          onSave={(title) =>
            void run((orgId) => api.changeTitle(orgId, action.member.id, title))
          }
        />
      ) : null}
      {action?.kind === "role" ? (
        <RoleModal
          member={action.member}
          saving={admin.isSaving}
          onClose={() => setAction(null)}
          onSave={(role) =>
            void run((orgId) => api.changeRole(orgId, action.member.id, role))
          }
        />
      ) : null}
      {action?.kind === "status" ? (
        <Modal
          open
          size="small"
          onClose={() => setAction(null)}
          title={
            action.member.status === "ACTIVE"
              ? isEs
                ? `¿Desactivar el inicio de sesión de ${action.member.name ?? action.member.email}?`
                : `Turn off sign-in for ${action.member.name ?? action.member.email}?`
              : isEs
                ? `¿Reactivar el inicio de sesión de ${action.member.name ?? action.member.email}?`
                : `Turn sign-in back on for ${action.member.name ?? action.member.email}?`
          }
          description={
            action.member.status === "ACTIVE"
              ? isEs
                ? "Se cerrará su sesión en todos los dispositivos de inmediato y no podrá abrir este consultorio hasta que se reactive. El registro de lo que hizo se conserva."
                : "They are signed out everywhere at once and can't open this office until it is turned back on. Their record of what they did stays."
              : isEs
                ? "Podrá volver a iniciar sesión en este consultorio con su propia cuenta."
                : "They can sign in to this office again with their own account."
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setAction(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant={
                  action.member.status === "ACTIVE" ? "danger" : "primary"
                }
                disabled={admin.isSaving}
                onClick={() =>
                  void run((orgId) =>
                    action.member.status === "ACTIVE"
                      ? api.deactivateStaff(orgId, action.member.id)
                      : api.reactivateStaff(orgId, action.member.id),
                  )
                }
              >
                {action.member.status === "ACTIVE"
                  ? isEs
                    ? "Desactivar"
                    : "Turn off"
                  : isEs
                    ? "Activar"
                    : "Turn on"}
              </Button>
            </>
          }
        />
      ) : null}
      {action?.kind === "owner" ? (
        <OwnerModal
          member={action.member}
          saving={admin.isSaving}
          onClose={() => setAction(null)}
          onTransfer={(formerOwnerRole) =>
            void run(
              (orgId) =>
                api.transferOwnership(orgId, action.member.id, formerOwnerRole),
              true,
            )
          }
        />
      ) : null}
    </div>
  );
}

function TitleModal({
  member,
  saving,
  onSave,
  onClose,
}: {
  member: api.StaffMember;
  saving: boolean;
  onSave: (title: string | null) => void;
  onClose: () => void;
}) {
  const isEs = useLanguageCode() === "ES";
  const [title, setTitle] = useState(member.title ?? "");
  return (
    <Modal
      open
      size="small"
      onClose={onClose}
      title={
        isEs
          ? `Cargo de ${member.name ?? member.email}`
          : `Title for ${member.name ?? member.email}`
      }
      description={
        isEs
          ? "Se muestra junto a su nombre, como RN o LMSW. No cambia lo que puede hacer."
          : "Shown next to their name, such as RN or LMSW. It does not change what they can do."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            disabled={saving}
            onClick={() => onSave(title.trim() ? title.trim() : null)}
          >
            {isEs ? "Guardar cargo" : "Save title"}
          </Button>
        </>
      }
    >
      <FormField label={isEs ? "Cargo" : "Title"}>
        {(field) => (
          <Input
            {...field}
            maxLength={api.TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}
      </FormField>
    </Modal>
  );
}

/** The roles this editor may hand out (none above their own levels; the
 *  owner role never). A 403 on the roles read is shown, not hidden. */
function RoleSelect({
  value,
  onChange,
  label,
  error,
}: {
  value: string;
  onChange: (role: string) => void;
  label: string;
  error?: string;
}) {
  const isEs = useLanguageCode() === "ES";
  const { permissions } = useAdminContext();
  const roles = useRoles(canLevel(permissions, "roles", 1));
  const options = useMemo(
    () => assignableRoles(permissions, roles.roles),
    [permissions, roles.roles],
  );
  if (!canLevel(permissions, "roles", 1))
    return (
      <Alert tone="warning" live={false}>
        {isEs ? (
          "Su rol no puede ver los roles de esta organización, así que no puede asignar ninguno."
        ) : (
          <>
            Your role can&apos;t read this organization&apos;s roles, so it
            can&apos;t assign one.
          </>
        )}
      </Alert>
    );
  if (roles.error)
    return <Alert tone="danger">{adminErrorText(roles.error, isEs)}</Alert>;
  return (
    <FormField label={label} required error={error}>
      {(field) => (
        <Select
          {...field}
          value={value}
          disabled={roles.isPending}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {roles.isPending
              ? isEs
                ? "Cargando roles…"
                : "Loading roles…"
              : isEs
                ? "Elija un rol"
                : "Choose a role"}
          </option>
          {options.map((r) => (
            <option key={r.name} value={r.name}>
              {r.name}
            </option>
          ))}
        </Select>
      )}
    </FormField>
  );
}

function RoleModal({
  member,
  saving,
  onSave,
  onClose,
}: {
  member: api.StaffMember;
  saving: boolean;
  onSave: (role: string) => void;
  onClose: () => void;
}) {
  const isEs = useLanguageCode() === "ES";
  const [role, setRole] = useState("");
  return (
    <Modal
      open
      size="small"
      onClose={onClose}
      title={
        isEs
          ? `Cambiar el rol de ${member.name ?? member.email}`
          : `Change the role of ${member.name ?? member.email}`
      }
      description={
        isEs
          ? `Rol actual: ${member.role}. Se cerrará su sesión y volverá a iniciarla con el nuevo acceso.`
          : `Now: ${member.role}. They will be signed out and sign in again with the new access.`
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            disabled={saving || !role || role === member.role}
            onClick={() => onSave(role)}
          >
            {isEs ? "Cambiar rol" : "Change role"}
          </Button>
        </>
      }
    >
      <RoleSelect
        label={isEs ? "Nuevo rol" : "New role"}
        value={role}
        onChange={setRole}
      />
    </Modal>
  );
}

function OwnerModal({
  member,
  saving,
  onTransfer,
  onClose,
}: {
  member: api.StaffMember;
  saving: boolean;
  onTransfer: (formerOwnerRole: string) => void;
  onClose: () => void;
}) {
  const isEs = useLanguageCode() === "ES";
  const [role, setRole] = useState("");
  return (
    <Modal
      open
      size="small"
      onClose={onClose}
      title={
        isEs
          ? `¿Hacer propietario a ${member.name ?? member.email}?`
          : `Make ${member.name ?? member.email} the owner?`
      }
      description={
        isEs
          ? "Recibirá todos los permisos de esta organización. Usted conservará el rol que elija abajo. Se cerrará la sesión de ambos y deberán volver a iniciarla."
          : "They get every permission in this organization. You keep the role you choose below. Both of you are signed out and sign in again."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            variant="danger"
            disabled={saving || !role}
            onClick={() => onTransfer(role)}
          >
            {isEs ? "Transferir la propiedad" : "Transfer ownership"}
          </Button>
        </>
      }
    >
      <RoleSelect
        label={isEs ? "Su rol después" : "Your role afterwards"}
        value={role}
        onChange={setRole}
      />
    </Modal>
  );
}

/* ---------------------------------------------------------- invitations */

function InvitationsPanel({ canInvite }: { canInvite: boolean }) {
  const isEs = useLanguageCode() === "ES";
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<api.InvitationStatus | "">("PENDING");
  const list = useStaffInvitations({ page, status: status || undefined });
  const admin = useStaffAdmin();
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (
    work: (orgId: string) => Promise<unknown>,
    done: string,
  ) => {
    setError(null);
    setNotice(null);
    try {
      await admin.run(work);
      setNotice(done);
    } catch (cause) {
      setError(adminErrorText(cause, isEs));
    }
  };

  if (list.error) {
    return (
      <div className="p-card">
        <ErrorState
          title={errorTitleFor(
            list.error,
            isEs
              ? "Las invitaciones no se cargaron"
              : "Invitations could not be loaded",
            isEs ? "es" : "en",
          )}
          message={errorMessageFor(list.error, undefined, isEs ? "es" : "en")}
          onRetry={canRetry(list.error) ? list.refetch : undefined}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-inline-md px-card pb-stack-md">
        <FormField label={isEs ? "Mostrar" : "Show"} className="w-48">
          {(field) => (
            <Select
              {...field}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as api.InvitationStatus | "");
                setPage(1);
              }}
            >
              <option value="PENDING">
                {isEs ? STATUS_TEXT.PENDING.es : STATUS_TEXT.PENDING.en}
              </option>
              <option value="">{isEs ? "Todas" : "All"}</option>
              <option value="ACCEPTED">
                {isEs ? STATUS_TEXT.ACCEPTED.es : STATUS_TEXT.ACCEPTED.en}
              </option>
              <option value="EXPIRED">
                {isEs ? STATUS_TEXT.EXPIRED.es : STATUS_TEXT.EXPIRED.en}
              </option>
              <option value="REVOKED">
                {isEs ? STATUS_TEXT.REVOKED.es : STATUS_TEXT.REVOKED.en}
              </option>
              <option value="DECLINED">
                {isEs ? STATUS_TEXT.DECLINED.es : STATUS_TEXT.DECLINED.en}
              </option>
            </Select>
          )}
        </FormField>
        {canInvite ? (
          <Button
            size="small"
            leadingIcon={<UserPlus />}
            onClick={() => setInviting(true)}
          >
            {isEs ? "Invitar personal" : "Invite staff"}
          </Button>
        ) : null}
      </div>
      <div className="space-y-stack-sm px-card pb-stack-sm">
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
      </div>
      <Table minWidth={640}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>
              {isEs ? "Correo electrónico" : "Email"}
            </TableHeaderCell>
            <TableHeaderCell>{isEs ? "Rol" : "Role"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Vence" : "Expires"}</TableHeaderCell>
            <TableHeaderCell className="text-right">
              {isEs ? "Acciones" : "Actions"}
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        {list.isPending ? (
          <TableSkeleton rows={3} columns={5} />
        ) : (
          <TableBody>
            {list.rows.length === 0 ? (
              <TableEmptyRow colSpan={5}>
                {isEs ? "No hay invitaciones aquí." : "No invitations here."}
              </TableEmptyRow>
            ) : (
              list.rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell emphasis>{inv.email}</TableCell>
                  <TableCell>{inv.role}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[inv.status] ?? "neutral"}>
                      {STATUS_TEXT[inv.status]?.[isEs ? "es" : "en"] ??
                        inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.status === "PENDING"
                      ? formatDate(inv.expiresAt, isEs)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canInvite && inv.status === "PENDING" ? (
                      <div className="flex justify-end gap-inline-xs">
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="ghost"
                          leadingIcon={<RotateCw />}
                          aria-label={
                            isEs
                              ? `Reenviar la invitación a ${inv.email}`
                              : `Resend the invitation to ${inv.email}`
                          }
                          disabled={admin.isSaving}
                          onClick={() =>
                            void run(
                              (orgId) => api.resendInvitation(orgId, inv.id),
                              isEs
                                ? `Se envió un nuevo enlace a ${inv.email}. El anterior ya no funciona.`
                                : `A new link was sent to ${inv.email}. The old one no longer works.`,
                            )
                          }
                        >
                          {isEs ? "Reenviar" : "Resend"}
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          appearance="ghost"
                          aria-label={
                            isEs
                              ? `Retirar la invitación a ${inv.email}`
                              : `Withdraw the invitation to ${inv.email}`
                          }
                          disabled={admin.isSaving}
                          onClick={() =>
                            void run(
                              (orgId) => api.revokeInvitation(orgId, inv.id),
                              isEs
                                ? `Se retiró la invitación a ${inv.email}.`
                                : `The invitation to ${inv.email} was withdrawn.`,
                            )
                          }
                        >
                          {isEs ? "Retirar" : "Withdraw"}
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        )}
      </Table>
      <TablePagination
        page={page}
        pageCount={offsetMeta(list.pagination)?.pages ?? 1}
        onPageChange={setPage}
      />
      {inviting ? (
        <InviteModal
          saving={admin.isSaving}
          onClose={() => setInviting(false)}
          onInvite={async (email, role) => {
            setError(null);
            try {
              await admin.run((orgId) => api.inviteStaff(orgId, email, role));
              setInviting(false);
              setNotice(
                isEs
                  ? `Se envió la invitación a ${email.trim().toLowerCase()}. Solo se puede usar una vez y vence en 7 días.`
                  : `Invitation sent to ${email.trim().toLowerCase()}. It works once and expires in 7 days.`,
              );
              return null;
            } catch (cause) {
              return adminErrorText(cause, isEs);
            }
          }}
        />
      ) : null}
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteModal({
  saving,
  onInvite,
  onClose,
}: {
  saving: boolean;
  onInvite: (email: string, role: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const isEs = useLanguageCode() === "ES";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailOk = EMAIL.test(email.trim()) && email.length <= api.EMAIL_MAX;
  return (
    <Modal
      open
      onClose={onClose}
      title={isEs ? "Invitar personal" : "Invite staff"}
      description={
        isEs
          ? "La persona inicia sesión con su propia cuenta (o crea una con este correo electrónico) y luego acepta. Nadie establece una contraseña por ella."
          : "They sign in with their own account (or create one with this email), then accept. No one sets a password for them."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            leadingIcon={<Mail />}
            disabled={saving}
            onClick={async () => {
              setTried(true);
              if (!emailOk || !role) return;
              setError(await onInvite(email, role));
            }}
          >
            {isEs ? "Enviar invitación" : "Send invitation"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <FormField
          label={isEs ? "Su correo electrónico" : "Their email"}
          required
          error={
            tried && !emailOk
              ? isEs
                ? "Ingrese un correo electrónico válido."
                : "Enter a valid email address."
              : undefined
          }
        >
          {(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </FormField>
        <RoleSelect
          label={isEs ? "Rol" : "Role"}
          value={role}
          onChange={setRole}
          error={
            tried && !role
              ? isEs
                ? "Elija un rol."
                : "Choose a role."
              : undefined
          }
        />
      </div>
    </Modal>
  );
}
