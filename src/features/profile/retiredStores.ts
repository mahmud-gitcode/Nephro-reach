/* ==========================================================================
   The member stores Phases 4 and 5 retired (test-only list)
   --------------------------------------------------------------------------
   Each name moved to the API in the same change that added it to the
   purge registry (`@/lib/data/legacyPurge`). The legacy-restore tests read
   this list, so a store added here without a registry entry fails them.
   ========================================================================== */

export const PHASE_4_RETIRED = [
  "quick-actions",
  "fluid-unit",
  "member-tour-done",
  "my-health",
  "profile-emergency-contact",
  "care-contacts",
  "dialysis-clinic",
  "healthcare-team",
] as const;

/** The files of the Phase 4 data layer: none may touch browser storage. */
export const PHASE_4_DATA_FILES = [
  "src/features/profile/preferences.repository.ts",
  "src/features/profile/usePreferences.ts",
  "src/features/profile/profile.repository.ts",
  "src/features/profile/emergencyContact.ts",
  "src/features/profile/emergencyContact.repository.ts",
  "src/features/profile/useEmergencyContact.ts",
  "src/features/profile/careContacts.ts",
  "src/features/profile/useCareContacts.ts",
  "src/features/profile/homeDialysisClinic.ts",
  "src/features/profile/useHomeDialysisClinic.ts",
  "src/features/profile/useClinicEnrollment.ts",
  "src/features/profile/directory.ts",
  "src/features/my-health/health.repository.ts",
  "src/features/my-health/useMyHealth.ts",
  "src/features/care-team/healthcareTeam.ts",
  "src/features/care-team/useHealthcareTeam.ts",
  "src/features/travel/clinic.repository.ts",
  "src/features/travel/useDialysisClinic.ts",
  "src/features/dashboard/quickActions.ts",
  "src/features/dashboard/QuickActionsSection.tsx",
  "src/features/onboarding/MemberTour.tsx",
  "src/features/personal-log/nutrition/fluidUnit.ts",
] as const;
