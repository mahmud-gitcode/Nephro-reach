"use client";

import React, { useState } from "react";
import {
  BookLock,
  HandHeart,
  Mail,
  Plus,
  RotateCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormField,
  Input,
  Modal,
  RadioCard,
  RadioGroup,
  Select,
  Skeleton,
  SwitchRow,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { isApiError } from "@/lib/api/client";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import {
  CAREGIVER_AREAS,
  CAREGIVER_PRESETS,
  CAREGIVER_RELATIONSHIPS,
  type CaregiverGrant,
  type CaregiverInvitation,
  type CaregiverPermissions,
  type CaregiverPreset,
  type CaregiverRelationship,
} from "./caregivers.api";
import { useLanguageCode } from "@/context/LanguageContext";
import {
  activityLabel,
  areaLabel,
  areaLevel,
  emptyCustomMap,
  levelLabel,
  neverCovered,
  outcomeLabel,
  presetDescription,
  presetLabel,
  relationshipLabel,
} from "./caregivers.mapping";
import { useCaregiverActivity, useMyCaregivers } from "./useCaregivers";

/* ==========================================================================
   My Caregivers: the patient invites and decides (Phase 3, D1)
   --------------------------------------------------------------------------
   - An invitation needs an explicit access choice: nothing is preselected.
   - Full Access is sent only after the patient authorizes it on a screen
     that says what it covers and what it never covers (password, security
     settings, account ownership, caregiver permissions, the journal).
   - The private journal is its own permission, turned on per caregiver
     with its own confirmation; no preset ever includes it.
   - Revoking ends access at once (the caregiver's next request is refused).
   Everything is the server's answer: the lists are re-read after each
   change, and a refusal shows the server's reason, never a silent failure.
   ========================================================================== */

const HREF = "/dashboard/my-caregivers";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SAVE_ERRORS: Record<string, string> = {
  "invitations.cannot_invite_yourself": "This is your own email. Use theirs.",
  "invitations.invitation_already_pending":
    "An invitation to this email is already waiting. Resend it instead.",
  "invitations.already_a_caregiver": "This person is already your caregiver.",
  "invitations.permissions_only_for_custom":
    "Choose Custom access to set each area yourself.",
  "invitations.custom_permissions_required":
    "Choose at least one area for custom access.",
};

const SAVE_ERRORS_ES: Record<string, string> = {
  "invitations.cannot_invite_yourself":
    "Este es su propio correo electrónico. Use el de la otra persona.",
  "invitations.invitation_already_pending":
    "Ya hay una invitación pendiente para este correo electrónico. Reenvíela en su lugar.",
  "invitations.already_a_caregiver": "Esta persona ya es su cuidador.",
  "invitations.permissions_only_for_custom":
    "Elija el acceso Personalizado para definir cada área usted mismo.",
  "invitations.custom_permissions_required":
    "Elija al menos un área para el acceso personalizado.",
};

/** What a refused change says: the server's reason by code, or a generic
 *  line (a 403 means this account may not do it). */
export function saveErrorText(error: unknown, isEs = false): string {
  const generic = isEs
    ? "Ese cambio no se guardó. Intente de nuevo."
    : "That change did not save. Try again.";
  if (!isApiError(error)) return generic;
  const known = isEs ? SAVE_ERRORS_ES : SAVE_ERRORS;
  if (error.code && known[error.code]) return known[error.code];
  if (error.status === 403)
    return isEs
      ? "Su cuenta no puede hacer este cambio."
      : "Your account can't make this change.";
  if (error.status === 409)
    return isEs
      ? "Esto cambió mientras tanto. La lista se ha actualizado."
      : "This changed in the meantime. The list has been refreshed.";
  return error.messages[0] ?? generic;
}

function when(iso: string, isEs = false): string {
  return new Date(iso).toLocaleString(isEs ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function day(iso: string, isEs = false): string {
  return new Date(iso).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyCaregivers() {
  const mine = useMyCaregivers();
  const isEs = useLanguageCode() === "ES";
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<CaregiverGrant | null>(null);
  const [editing, setEditing] = useState<CaregiverGrant | null>(null);
  const [journal, setJournal] = useState<{
    grant: CaregiverGrant;
    open: boolean;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
      return true;
    } catch (cause) {
      setActionError(saveErrorText(cause, isEs));
      return false;
    }
  };

  const nothing = mine.grants.length === 0 && mine.invitations.length === 0;

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        action={
          <Button leadingIcon={<Plus />} onClick={() => setInviting(true)}>
            {isEs ? "Invitar cuidador" : "Invite caregiver"}
          </Button>
        }
      />

      <Alert tone="info" icon={<HandHeart />} live={false}>
        {isEs
          ? "Un cuidador inicia sesión con su propia cuenta y solo ve lo que usted elija. Nunca puede cambiar su contraseña, su configuración de seguridad ni quiénes son sus cuidadores, y todo lo que hace queda registrado a su propio nombre. Puede quitarlo en cualquier momento."
          : "A caregiver signs in with their own account and sees only what you choose. They can never change your password, your security settings or who your caregivers are, and everything they do is recorded under their own name. Remove them at any time."}
      </Alert>

      {actionError ? (
        <Alert tone="danger" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      ) : null}

      <AsyncSection
        pending={mine.isPending}
        error={mine.error}
        errorTitle={errorTitleFor(mine.error, undefined, isEs ? "es" : "en")}
        errorMessage={errorMessageFor(
          mine.error,
          undefined,
          isEs ? "es" : "en",
        )}
        onRetry={canRetry(mine.error) ? mine.refetch : undefined}
        isEmpty={nothing}
        skeleton={<Skeleton height={240} />}
        empty={
          <EmptyState
            icon={<HandHeart />}
            title={isEs ? "Aún no tiene cuidadores" : "No caregivers yet"}
            description={
              isEs
                ? "Invite a un familiar o amigo que le ayude con su atención."
                : "Invite a family member or friend who helps with your care."
            }
            action={
              <Button leadingIcon={<Plus />} onClick={() => setInviting(true)}>
                {isEs ? "Invitar cuidador" : "Invite caregiver"}
              </Button>
            }
          />
        }
      >
        {mine.grants.length > 0 ? (
          <section
            aria-label={isEs ? "Sus cuidadores" : "Your caregivers"}
            className="space-y-stack-md"
          >
            <h2 className="text-heading-4 text-fg">
              {isEs ? "Sus cuidadores" : "Your caregivers"}
            </h2>
            <div className="grid grid-cols-1 gap-stack-lg xl:grid-cols-2">
              {mine.grants.map((g) => (
                <CaregiverCard
                  key={g.id}
                  grant={g}
                  isEs={isEs}
                  busy={mine.isSaving}
                  onEdit={() => setEditing(g)}
                  onRemove={() => setRemoving(g)}
                  onJournal={(open) => setJournal({ grant: g, open })}
                />
              ))}
            </div>
          </section>
        ) : null}

        {mine.invitations.length > 0 ? (
          <Card
            as="section"
            aria-label={
              isEs ? "Invitaciones pendientes" : "Waiting invitations"
            }
          >
            <CardHeader
              title={isEs ? "Invitaciones pendientes" : "Waiting invitations"}
              description={
                isEs
                  ? "Cada enlace funciona una sola vez y vence. Al reenviar se envía un enlace nuevo y el anterior deja de funcionar."
                  : "Each link works once and expires. Resending sends a new link and the old one stops working."
              }
            />
            <ul className="mt-stack-md divide-y divide-line">
              {mine.invitations.map((inv) => (
                <InvitationRow
                  key={inv.id}
                  invitation={inv}
                  isEs={isEs}
                  busy={mine.isSaving}
                  onResend={() => void run(() => mine.resendInvitation(inv.id))}
                  onRevoke={() => void run(() => mine.revokeInvitation(inv.id))}
                />
              ))}
            </ul>
          </Card>
        ) : null}
      </AsyncSection>

      {inviting ? (
        <InviteModal
          isEs={isEs}
          onClose={() => setInviting(false)}
          onSend={async (body) => {
            await mine.invite(body);
          }}
        />
      ) : null}

      {editing ? (
        <AccessModal
          grant={editing}
          isEs={isEs}
          onClose={() => setEditing(null)}
          onSave={async (preset, map) => {
            await mine.changeAccess(editing, preset, map);
          }}
        />
      ) : null}

      {journal ? (
        <Modal
          open
          size="small"
          onClose={() => setJournal(null)}
          title={
            isEs
              ? journal.open
                ? `¿Permitir que ${nameOf(journal.grant, true)} lea su diario privado?`
                : `¿Dejar de compartir su diario con ${nameOf(journal.grant, true)}?`
              : journal.open
                ? `Let ${nameOf(journal.grant)} read your private journal?`
                : `Stop sharing your journal with ${nameOf(journal.grant)}?`
          }
          description={
            isEs
              ? journal.open
                ? "Su diario es privado. Este es un permiso separado de su otro acceso: podrá leer sus entradas, no cambiarlas. Puede desactivarlo en cualquier momento."
                : "Ya no podrá leer su diario. Lo que ya leyó no se puede deshacer."
              : journal.open
                ? "Your journal is private. This is a separate permission from their other access: they will be able to read your entries, not change them. You can turn it off at any time."
                : "They will no longer be able to read your journal. What they already read cannot be taken back."
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setJournal(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant={journal.open ? "primary" : "danger"}
                disabled={mine.isSaving}
                onClick={async () => {
                  const target = journal;
                  setJournal(null);
                  await run(() => mine.setJournal(target.grant, target.open));
                }}
              >
                {isEs
                  ? journal.open
                    ? "Permitir acceso al diario"
                    : "Dejar de compartir"
                  : journal.open
                    ? "Allow journal access"
                    : "Stop sharing"}
              </Button>
            </>
          }
        />
      ) : null}

      {removing ? (
        <Modal
          open
          size="small"
          onClose={() => setRemoving(null)}
          title={
            isEs
              ? `¿Quitar a ${nameOf(removing, true)}?`
              : `Remove ${nameOf(removing)}?`
          }
          description={
            isEs
              ? "Perderá el acceso a su cuenta de inmediato. Lo que ya vio no se puede deshacer, y todo lo que cambió permanece en sus registros a su nombre."
              : "They lose access to your account straight away. What they already saw cannot be taken back, and anything they changed stays in your records under their name."
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setRemoving(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                disabled={mine.isSaving}
                onClick={async () => {
                  const target = removing;
                  setRemoving(null);
                  await run(() => mine.revokeGrant(target.id));
                }}
              >
                {isEs ? "Quitar cuidador" : "Remove caregiver"}
              </Button>
            </>
          }
        />
      ) : null}
    </div>
  );
}

const nameOf = (g: CaregiverGrant, isEs = false) =>
  g.caregiverName ||
  g.caregiverEmail ||
  (isEs ? "su cuidador" : "your caregiver");

function AccessList({
  permissions,
  isEs,
}: {
  permissions: CaregiverPermissions;
  isEs: boolean;
}) {
  const open = CAREGIVER_AREAS.filter((a) => areaLevel(permissions, a) > 0);
  if (open.length === 0)
    return (
      <p className="text-body-sm text-fg-muted">
        {isEs ? "No se comparte ninguna área." : "No areas shared."}
      </p>
    );
  return (
    <ul className="grid grid-cols-1 gap-x-inline-lg gap-y-stack-xs sm:grid-cols-2">
      {open.map((a) => (
        <li key={a} className="flex justify-between gap-inline-sm text-body-sm">
          <span className="text-fg">{areaLabel(a, isEs)}</span>
          <span className="shrink-0 text-fg-muted">
            {levelLabel(areaLevel(permissions, a), isEs)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CaregiverCard({
  grant,
  isEs,
  busy,
  onEdit,
  onRemove,
  onJournal,
}: {
  grant: CaregiverGrant;
  isEs: boolean;
  busy: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onJournal: (open: boolean) => void;
}) {
  const journalOpen = areaLevel(grant.permissions, "journal") > 0;
  return (
    <Card>
      <CardHeader
        title={nameOf(grant, isEs)}
        description={`${relationshipLabel(grant.relationship, isEs)}${grant.caregiverEmail ? ` · ${grant.caregiverEmail}` : ""}`}
        action={<Badge tone="success">{presetLabel(grant.preset, isEs)}</Badge>}
      />
      <h3 className="mt-stack-lg text-label-md text-fg">
        {isEs ? "Lo que puede usar" : "What they can use"}
      </h3>
      <div className="mt-stack-xs">
        <AccessList permissions={grant.permissions} isEs={isEs} />
      </div>

      <SwitchRow
        className="mt-stack-lg"
        checked={journalOpen}
        disabled={busy}
        onChange={(next) => onJournal(next)}
        title={
          <span className="inline-flex items-center gap-inline-sm">
            <BookLock aria-hidden="true" className="size-4" />
            {isEs ? "Diario privado" : "Private journal"}
          </span>
        }
        description={
          isEs
            ? journalOpen
              ? "Puede leer las entradas de su diario."
              : "No se comparte. Esto requiere su permiso por separado."
            : journalOpen
              ? "They can read your journal entries."
              : "Not shared. This needs your separate permission."
        }
      />

      <ActivityList grantId={grant.id} isEs={isEs} />

      <div className="mt-stack-lg flex flex-wrap justify-end gap-inline-sm">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          leadingIcon={<SlidersHorizontal />}
          onClick={onEdit}
        >
          {isEs ? "Cambiar acceso" : "Change access"}
        </Button>
        <Button
          variant="danger"
          appearance="fill-stroke"
          leadingIcon={<Trash2 />}
          onClick={onRemove}
        >
          {isEs ? "Quitar cuidador" : "Remove caregiver"}
        </Button>
      </div>
    </Card>
  );
}

function ActivityList({ grantId, isEs }: { grantId: string; isEs: boolean }) {
  const [page, setPage] = useState(1);
  const activity = useCaregiverActivity(grantId, page);
  return (
    <section
      aria-label={isEs ? "Actividad reciente" : "Recent activity"}
      className="mt-stack-lg"
    >
      <h3 className="text-label-md text-fg">
        {isEs ? "Actividad reciente" : "Recent activity"}
      </h3>
      {activity.error ? (
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {errorTitleFor(
            activity.error,
            isEs ? "La actividad no se cargó." : "Activity did not load.",
            isEs ? "es" : "en",
          )}
        </p>
      ) : activity.isPending ? (
        <Skeleton height={60} className="mt-stack-xs" />
      ) : activity.rows.length === 0 ? (
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {isEs ? "Nada todavía." : "Nothing yet."}
        </p>
      ) : (
        <ul className="mt-stack-xs space-y-stack-xs">
          {activity.rows.map((a, i) => (
            <li
              key={`${a.createdAt}-${i}`}
              className="flex justify-between gap-inline-md text-body-sm"
            >
              <span className="text-fg">
                {activityLabel(a, isEs)}
                {a.outcome !== "SUCCESS"
                  ? ` (${outcomeLabel(a.outcome, isEs)})`
                  : ""}
              </span>
              <span className="shrink-0 text-fg-muted tabular-nums">
                {when(a.createdAt, isEs)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {activity.hasMore || page > 1 ? (
        <div className="mt-stack-xs flex gap-inline-sm">
          {page > 1 ? (
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              onClick={() => setPage((p) => p - 1)}
            >
              {isEs ? "Más recientes" : "Newer"}
            </Button>
          ) : null}
          {activity.hasMore ? (
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              onClick={() => setPage((p) => p + 1)}
            >
              {isEs ? "Anteriores" : "Older"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function InvitationRow({
  invitation,
  isEs,
  busy,
  onResend,
  onRevoke,
}: {
  invitation: CaregiverInvitation;
  isEs: boolean;
  busy: boolean;
  onResend: () => void;
  onRevoke: () => void;
}) {
  return (
    <li className="flex flex-col gap-stack-sm py-stack-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-label-md text-fg">{invitation.email}</p>
        <p className="text-caption text-fg-muted">
          {relationshipLabel(invitation.relationship, isEs)} ·{" "}
          {presetLabel(invitation.preset, isEs)} · {isEs ? "Vence" : "Expires"}{" "}
          {day(invitation.expiresAt, isEs)}
        </p>
      </div>
      <div className="flex gap-inline-sm">
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          leadingIcon={<RotateCw />}
          disabled={busy}
          onClick={onResend}
        >
          {isEs ? "Reenviar" : "Resend"}
        </Button>
        <Button
          size="small"
          variant="danger"
          appearance="fill-stroke"
          disabled={busy}
          onClick={onRevoke}
        >
          {isEs ? "Retirar" : "Withdraw"}
        </Button>
      </div>
    </li>
  );
}

/* ------------------------------------------------- choosing the access */

function CustomEditor({
  value,
  isEs,
  onChange,
}: {
  value: CaregiverPermissions;
  isEs: boolean;
  onChange: (next: CaregiverPermissions) => void;
}) {
  return (
    <fieldset className="space-y-stack-xs">
      <legend className="text-label-md text-fg">
        {isEs ? "Cada área" : "Each area"}
      </legend>
      {CAREGIVER_AREAS.map((area) => {
        const level = areaLevel(value, area);
        return (
          <div
            key={area}
            className="flex items-center justify-between gap-inline-md"
          >
            <label htmlFor={`cg-area-${area}`} className="text-body-sm text-fg">
              {areaLabel(area, isEs)}
            </label>
            <Select
              id={`cg-area-${area}`}
              className="w-36"
              value={String(level)}
              onChange={(e) =>
                onChange({ ...value, [area]: Number(e.target.value) })
              }
            >
              <option value="0">{levelLabel(0, isEs)}</option>
              <option value="1">{levelLabel(1, isEs)}</option>
              <option value="2">{levelLabel(2, isEs)}</option>
              {/* Level 3 is offered only to keep what the server already
                  holds; its meaning for a caregiver is still open (D1). */}
              {level === 3 ? (
                <option value="3">{levelLabel(3, isEs)}</option>
              ) : null}
            </Select>
          </div>
        );
      })}
    </fieldset>
  );
}

function PresetChoice({
  value,
  isEs,
  onChange,
}: {
  value: CaregiverPreset | "";
  isEs: boolean;
  onChange: (preset: CaregiverPreset) => void;
}) {
  return (
    <RadioGroup
      label={isEs ? "Lo que puede usar" : "What they can use"}
      value={value}
      onChange={(v) => onChange(v as CaregiverPreset)}
    >
      {CAREGIVER_PRESETS.map((p) => (
        <RadioCard
          key={p}
          value={p}
          title={presetLabel(p, isEs)}
          description={presetDescription(p, isEs)}
        />
      ))}
    </RadioGroup>
  );
}

/** The D1 authorization step for Full Access: what it covers, what it
 *  never covers. Nothing is sent until the patient confirms here. */
export function FullAccessAuthorization({
  isEs = false,
}: { isEs?: boolean } = {}) {
  return (
    <div className="space-y-stack-md">
      <Alert tone="warning" icon={<ShieldCheck />} live={false}>
        {isEs
          ? "El Acceso completo le permite ver y actualizar, en su nombre, su perfil, registros personales, nutrición, chequeos, visitas a la sala de emergencias, diálisis, medicamentos, laboratorios y sus mensajes con su equipo de atención."
          : "Full Access lets them view and update your profile, personal logs, nutrition, check-ins, ER visits, dialysis, medications, labs and your messages with your care team, for you."}
      </Alert>
      <div>
        <h3 className="text-label-md text-fg">
          {isEs ? "Nunca incluye" : "It never covers"}
        </h3>
        <ul className="mt-stack-xs list-disc space-y-stack-xs pl-5 text-body-sm text-fg-secondary">
          {neverCovered(isEs).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <p className="text-body-sm text-fg-muted">
        {isEs
          ? "Todo lo que haga queda registrado a su propio nombre. Puede cambiar su acceso o quitarlo en cualquier momento."
          : "Everything they do is recorded under their own name. You can change their access or remove them at any time."}
      </p>
    </div>
  );
}

function InviteModal({
  isEs,
  onSend,
  onClose,
}: {
  isEs: boolean;
  onSend: (body: {
    email: string;
    relationship: CaregiverRelationship;
    preset: CaregiverPreset;
    permissions?: CaregiverPermissions;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<CaregiverRelationship | "">(
    "",
  );
  const [preset, setPreset] = useState<CaregiverPreset | "">("");
  const [custom, setCustom] = useState<CaregiverPermissions>(emptyCustomMap);
  const [tried, setTried] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const emailOk = EMAIL.test(email.trim());
  const customOk =
    preset !== "custom" ||
    CAREGIVER_AREAS.some((a) => areaLevel(custom, a) > 0);
  const ready = emailOk && relationship !== "" && preset !== "" && customOk;

  const send = async () => {
    if (!ready) return;
    setSending(true);
    setError(null);
    try {
      await onSend({
        email,
        relationship: relationship as CaregiverRelationship,
        preset: preset as CaregiverPreset,
        ...(preset === "custom" ? { permissions: custom } : {}),
      });
      setSent(true);
    } catch (cause) {
      setAuthorizing(false);
      setError(saveErrorText(cause, isEs));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Modal
        open
        size="small"
        onClose={onClose}
        title={isEs ? "Invitación enviada" : "Invitation sent"}
        description={
          isEs
            ? `Enviamos un enlace a ${email.trim()}. Esa persona inicia sesión o crea su propia cuenta con ese correo electrónico y luego acepta. El enlace funciona una sola vez y vence en 7 días.`
            : `We emailed ${email.trim()} a link. They sign in or create their own account with that email, then accept. The link works once and expires in 7 days.`
        }
        footer={<Button onClick={onClose}>{isEs ? "Listo" : "Done"}</Button>}
      />
    );
  }

  if (authorizing) {
    return (
      <Modal
        open
        onClose={onClose}
        title={
          isEs ? "¿Autorizar el Acceso completo?" : "Authorize Full Access?"
        }
        description={
          isEs
            ? `Para ${email.trim()} (${relationshipLabel(relationship, true)}).`
            : `For ${email.trim()} (${relationship}).`
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setAuthorizing(false)}
            >
              {isEs ? "Atrás" : "Back"}
            </Button>
            <Button disabled={sending} onClick={() => void send()}>
              {isEs ? "Autorizo el Acceso completo" : "I authorize Full Access"}
            </Button>
          </>
        }
      >
        <FullAccessAuthorization isEs={isEs} />
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={isEs ? "Invitar a un cuidador" : "Invite a caregiver"}
      description={
        isEs
          ? "Alguien que le ayuda con su atención, como un familiar. Usted elige exactamente lo que puede usar."
          : "Someone who helps with your care, such as a family member. You choose exactly what they can use."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            leadingIcon={<Mail />}
            disabled={sending}
            onClick={() => {
              setTried(true);
              if (!ready) return;
              if (preset === "full") setAuthorizing(true);
              else void send();
            }}
          >
            {preset === "full"
              ? isEs
                ? "Continuar"
                : "Continue"
              : isEs
                ? "Enviar invitación"
                : "Send invitation"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2">
          <FormField
            label={isEs ? "Su correo electrónico" : "Their email"}
            required
            error={
              tried && !emailOk
                ? isEs
                  ? "Ingrese un correo electrónico válido."
                  : "Enter a valid email."
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
          <FormField
            label={isEs ? "Parentesco" : "Relationship"}
            required
            error={
              tried && relationship === ""
                ? isEs
                  ? "Elija una opción."
                  : "Choose one."
                : undefined
            }
          >
            {(field) => (
              <Select
                {...field}
                value={relationship}
                onChange={(e) =>
                  setRelationship(e.target.value as CaregiverRelationship)
                }
              >
                <option value="" disabled>
                  {isEs ? "Elija…" : "Choose…"}
                </option>
                {CAREGIVER_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {relationshipLabel(r, isEs)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
        <PresetChoice value={preset} isEs={isEs} onChange={setPreset} />
        {tried && preset === "" ? (
          <p className="text-body-sm text-danger" role="alert">
            {isEs ? "Elija lo que puede usar." : "Choose what they can use."}
          </p>
        ) : null}
        {preset === "custom" ? (
          <>
            <CustomEditor value={custom} isEs={isEs} onChange={setCustom} />
            {tried && !customOk ? (
              <p className="text-body-sm text-danger" role="alert">
                {isEs ? "Abra al menos un área." : "Open at least one area."}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </Modal>
  );
}

function AccessModal({
  grant,
  isEs,
  onSave,
  onClose,
}: {
  grant: CaregiverGrant;
  isEs: boolean;
  onSave: (
    preset: CaregiverPreset,
    map?: CaregiverPermissions,
  ) => Promise<void>;
  onClose: () => void;
}) {
  const known = (CAREGIVER_PRESETS as readonly string[]).includes(grant.preset)
    ? (grant.preset as CaregiverPreset)
    : "custom";
  const [preset, setPreset] = useState<CaregiverPreset>(known);
  const [custom, setCustom] = useState<CaregiverPermissions>(() => ({
    ...emptyCustomMap(),
    ...grant.permissions,
  }));
  const [authorizing, setAuthorizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(preset, preset === "custom" ? custom : undefined);
      onClose();
    } catch (cause) {
      setAuthorizing(false);
      setError(saveErrorText(cause, isEs));
    } finally {
      setSaving(false);
    }
  };

  if (authorizing) {
    return (
      <Modal
        open
        onClose={onClose}
        title={
          isEs ? "¿Autorizar el Acceso completo?" : "Authorize Full Access?"
        }
        description={
          isEs ? `Para ${nameOf(grant, true)}.` : `For ${nameOf(grant)}.`
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setAuthorizing(false)}
            >
              {isEs ? "Atrás" : "Back"}
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {isEs ? "Autorizo el Acceso completo" : "I authorize Full Access"}
            </Button>
          </>
        }
      >
        <FullAccessAuthorization isEs={isEs} />
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={
        isEs
          ? `Cambiar lo que ${nameOf(grant, true)} puede usar`
          : `Change what ${nameOf(grant)} can use`
      }
      description={
        isEs
          ? "El cambio se aplica a su próxima solicitud."
          : "The change applies to their next request."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            disabled={saving}
            onClick={() => {
              /* Moving TO Full Access repeats the authorization (D1). */
              if (preset === "full" && grant.preset !== "full")
                setAuthorizing(true);
              else void save();
            }}
          >
            {isEs ? "Guardar" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <PresetChoice value={preset} isEs={isEs} onChange={setPreset} />
        {preset === "custom" ? (
          <CustomEditor value={custom} isEs={isEs} onChange={setCustom} />
        ) : null}
        {preset !== "custom" && areaLevel(grant.permissions, "journal") > 0 ? (
          <Alert tone="warning" live={false}>
            {isEs
              ? "Un nivel de acceso predefinido nunca incluye su diario privado: al guardarlo, deja de compartir su diario con esa persona."
              : "A named access level never includes your private journal: saving it stops sharing your journal with them."}
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
