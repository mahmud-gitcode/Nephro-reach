/* ==========================================================================
   What a refused staff, invitation or role change says (Phase 3)
   --------------------------------------------------------------------------
   By the server's code first (each refusal has its own sentence), then by
   status. A 403 is "your role can't do this" (D4: no escalation), never a
   silent failure or an empty list.
   ========================================================================== */

import { isApiError } from "@/lib/api/client";

const BY_CODE: Record<string, string> = {
  "invitations.unknown_role": "That role does not exist in this organization.",
  "invitations.owner_role_reserved":
    "The owner role can't be given by invitation. Use ownership transfer.",
  "invitations.cannot_invite_higher_role":
    "You can't invite someone into a role with more access than your own.",
  "invitations.already_a_member": "This person is already a member.",
  "invitations.invitation_already_pending":
    "An invitation to this email is already waiting. Resend it instead.",
  "invitations.invitation_cannot_be_revoked":
    "This invitation can no longer be withdrawn.",
  "invitations.invitation_cannot_be_resent":
    "This invitation can no longer be resent.",
  "staff.role_in_use":
    "People or waiting invitations still use this role. Move them to another role first.",
  "access.cannot_grant_higher_level":
    "You can't give or take away a permission level you don't hold yourself.",
  "access.organization_access_denied": "Your role can't make this change.",
  "access.unknown_permission_resource":
    "That area doesn't apply to this organization.",
};

export function adminErrorText(error: unknown): string {
  if (!isApiError(error)) return "That change did not save. Try again.";
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.status === 403)
    return error.messages[0] ?? "Your role can't make this change.";
  if (error.status === 409)
    return error.messages[0] ?? "This changed in the meantime. Try again.";
  return error.messages[0] ?? "That change did not save. Try again.";
}
