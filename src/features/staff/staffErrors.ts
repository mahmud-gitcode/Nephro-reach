/* ==========================================================================
   What a refused staff, invitation or role change says (Phase 3)
   --------------------------------------------------------------------------
   By the server's code first (each refusal has its own sentence), then by
   status. A 403 is "your role can't do this" (D4: no escalation), never a
   silent failure or an empty list.
   ========================================================================== */

import { isApiError } from "@/lib/api/client";

const BY_CODE: Record<string, { en: string; es: string }> = {
  "invitations.unknown_role": {
    en: "That role does not exist in this organization.",
    es: "Ese rol no existe en esta organización.",
  },
  "invitations.owner_role_reserved": {
    en: "The owner role can't be given by invitation. Use ownership transfer.",
    es: "El rol de propietario no se puede asignar por invitación. Use la transferencia de propiedad.",
  },
  "invitations.cannot_invite_higher_role": {
    en: "You can't invite someone into a role with more access than your own.",
    es: "No puede invitar a alguien a un rol con más acceso que el suyo.",
  },
  "invitations.already_a_member": {
    en: "This person is already a member.",
    es: "Esta persona ya es miembro.",
  },
  "invitations.invitation_already_pending": {
    en: "An invitation to this email is already waiting. Resend it instead.",
    es: "Ya hay una invitación pendiente para este correo electrónico. Reenvíela en su lugar.",
  },
  "invitations.invitation_cannot_be_revoked": {
    en: "This invitation can no longer be withdrawn.",
    es: "Esta invitación ya no se puede retirar.",
  },
  "invitations.invitation_cannot_be_resent": {
    en: "This invitation can no longer be resent.",
    es: "Esta invitación ya no se puede reenviar.",
  },
  "staff.role_in_use": {
    en: "People or waiting invitations still use this role. Move them to another role first.",
    es: "Todavía hay personas o invitaciones pendientes con este rol. Primero páselas a otro rol.",
  },
  "access.cannot_grant_higher_level": {
    en: "You can't give or take away a permission level you don't hold yourself.",
    es: "No puede dar ni quitar un nivel de permiso que usted mismo no tiene.",
  },
  "access.organization_access_denied": {
    en: "Your role can't make this change.",
    es: "Su rol no puede hacer este cambio.",
  },
  "access.unknown_permission_resource": {
    en: "That area doesn't apply to this organization.",
    es: "Esa área no corresponde a esta organización.",
  },
};

/** `isEs` picks the Spanish sentence; a message the server wrote itself
 *  (`error.messages`) is shown as the server sent it. */
export function adminErrorText(error: unknown, isEs = false): string {
  const notSaved = isEs
    ? "Ese cambio no se guardó. Intente de nuevo."
    : "That change did not save. Try again.";
  if (!isApiError(error)) return notSaved;
  const known = error.code ? BY_CODE[error.code] : undefined;
  if (known) return isEs ? known.es : known.en;
  if (error.status === 403)
    return (
      error.messages[0] ??
      (isEs
        ? "Su rol no puede hacer este cambio."
        : "Your role can't make this change.")
    );
  if (error.status === 409)
    return (
      error.messages[0] ??
      (isEs
        ? "Esto cambió mientras tanto. Intente de nuevo."
        : "This changed in the meantime. Try again.")
    );
  return error.messages[0] ?? notSaved;
}
