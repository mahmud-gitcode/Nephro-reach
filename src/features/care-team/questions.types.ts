/* ==========================================================================
   Questions for the care team
   --------------------------------------------------------------------------
   What a member wants to ask their provider, dietitian, social worker or
   nurse, and what they were told. This is the list they open in the chair,
   so losing an entry loses the reason for an appointment.
   ========================================================================== */

export type CareTeamRole = "Provider" | "Dietitian" | "Social Worker" | "Nurse";
export type QuestionStatus = "Answered" | "Discussed" | "Submitted";

export interface CareTeamQuestion {
  id: string;
  role: CareTeamRole;
  question: string;
  status: QuestionStatus;
  answer?: string;
}
