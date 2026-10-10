# NephroReach data model — first draft

`schema.prisma` in this folder is the database the backend will be built
against. It was written from the frontend as it stands on 2026-10-08: every
localStorage store (66 keys) and its TypeScript type. It passes
`prisma validate` (PostgreSQL). Prisma is not installed in the app yet. The
file is a contract to review, not running code.

## The three ownership rules

Every table belongs to exactly one of these. Most security bugs in a
multi-tenant health app come from a table nobody decided this for.

| Owner            | Marked by        | Who can read it                                                                                                                                                                              |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Patient**      | `patientId`      | The patient, their caregivers (per `CaregiverGrant`), and an organization's staff only while a `CareRelationship` links them **and** the patient has shared that area (`PatientShareGrant`). |
| **Organization** | `organizationId` | That organization's staff, by role. Never another organization.                                                                                                                              |
| **Platform**     | neither          | Content an admin publishes: courses, library, Table Talk, plans.                                                                                                                             |

Patient-owned rows do **not** carry an `organizationId`. A patient belongs to
several offices at once (a dialysis center, an access center and a nephrology
office), so the link lives in `CareRelationship` and every staff query joins
through it. MRN lives there too, because an MRN is per facility.

## Rules the schema already encodes

- **Providers never overwrite patient entries.** Corrections go to
  `RecordRevision` (who / field / old / new / when). The medication change
  history uses the same table.
- **Every lab result has a `source`:** patient entered, provider entered,
  facility CSV import or future integration. A CSV upload is a
  `LabImportBatch` with accepted, refused and duplicate counts.
- **Audit:** `AuditLog` records every PHI read, write and export. It is
  written by the data-access layer, never by a page.
- **Files:** uploads become `FileObject` rows pointing at object storage.
  Nothing PHI is kept as a `data:` URL any more.
- **CCM compliance filter:** `isOnDialysis` and `isOnHomeHealthOrHospice` on
  `CcmEnrollment`.
- **After-hours reply and the 2-hour escalation:** office hours and
  `onCallPhone` are in `OrganizationSettings`. The escalation time is
  `ConversationState.escalatedAt`.
- **Community:** posts and likes only, with no replies table. Every post
  waits for moderation.

## Store → table map

| localStorage key                                                                           | Table(s)                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| staff-accounts, auth demo accounts                                                         | `User`, `StaffMembership`                                                                                                                                                 |
| clinic-settings, clinic-settings-actions                                                   | `Organization`, `OrganizationSettings`                                                                                                                                    |
| clinic-enrollments                                                                         | `Patient`, `CareRelationship`, `ProgramEnrollment`                                                                                                                        |
| blood-pressure-readings / bp-reminders                                                     | `BloodPressureReading` / `UserPreference.bpReminderTimes`                                                                                                                 |
| weight-fluid-log                                                                           | `WeightFluidEntry`                                                                                                                                                        |
| nutrition-foods / -fluids / -goals                                                         | `FoodEntry` / `DailyFluidIntake` / `NutritionGoal`                                                                                                                        |
| exercise-log                                                                               | `ExerciseEntry`                                                                                                                                                           |
| between-treatment-check-ins, clinic-notices                                                | `DailyCheckIn`, `ClinicNotice`                                                                                                                                            |
| dialysis-modality, -home-system, -treatment-vitals, -home-visits, -pd-exchanges, -supplies | `DialysisModalitySetting`, `HomeDialysisSystem`, `HomeTreatmentVitals`, `HomeVisit`, `PdExchange`, `SupplyMonth`                                                          |
| provider-orders, treatment-medications, dialysis-access-photos                             | `ProviderOrder`, `TreatmentMedication`, `AccessPhoto`                                                                                                                     |
| member-medications, medication-reminders, -doses, -refills, -side-effects, -mood           | `Medication` (+`needsRefill`), `MedicationReminder`, `DoseRecord`, `SideEffectRecord`, `MoodEntry`                                                                        |
| custom-lab-results, clinic-labs                                                            | `LabResult`, `LabImportBatch`                                                                                                                                             |
| member-appointments                                                                        | `Appointment`                                                                                                                                                             |
| my-health                                                                                  | `Allergy`, `MedicalCondition`                                                                                                                                             |
| profile-emergency-contact, care-contacts, dialysis-clinic, rides                           | `EmergencyContact`, `CareContact`, `HomeDialysisClinic`, `RideContact`                                                                                                    |
| care-team-questions, er-visits                                                             | `CareTeamQuestion`, `ErVisitReport`                                                                                                                                       |
| messaging, team-messages                                                                   | `Conversation`, `Message`, `ConversationState`, `TeamMessage`                                                                                                             |
| vascular-access                                                                            | `AccessProfile`, `AccessAppointment`, `AccessUpdate`, `AccessHistoryEntry`, `AccessConcern`, `TransportRequest`, `AccessMessage`, `AccessReferral`, `AccessReferralReply` |
| clinic-ccm, ccm-condition-library                                                          | `CcmEnrollment`, `CcmActivity`, `CcmInboxItem`, `CcmConditionLibraryEntry`                                                                                                |
| travel-trip-requests, travel-treatments, travel-reflections                                | `TripRequest` (+ status history, documents, confirmed treatments, time changes), `TravelTreatment`, `TravelReflection`                                                    |
| course-library                                                                             | `Course`, `CourseModule`, `CourseClass`                                                                                                                                   |
| classroom-learner, journey-progress, journey-notes                                         | `LearnerAnswer`, `QuizAttempt`, `Certificate`, `JourneyDayProgress`                                                                                                       |
| clinic-live-class                                                                          | `LiveClass`, `LiveClassSetting`                                                                                                                                           |
| library-resources / library-saved                                                          | `LibraryResource` / `LibrarySave`                                                                                                                                         |
| table-talk-*                                                                               | `TableTalkEpisode`, `TableTalkCategory`, `TableTalkEpisodeCategory`, `TableTalkFavorite`, `TableTalkQuestion`                                                             |
| community-moderation-queue                                                                 | `CommunityPost`, `CommunityLike`                                                                                                                                          |
| community-reviews, video-testimonials                                                      | `Review`, `Testimonial`                                                                                                                                                   |
| outside-shares                                                                             | `OutsideShare`, `OutsideShareEvent`, `OutsideShareInfoRequest`                                                                                                            |
| support-tickets                                                                            | `SupportTicket`, `SupportReply`                                                                                                                                           |
| subscription-plans, org-subscriptions, clinic-billing-actions                              | `SubscriptionPlan`, `MemberSubscription`, `OrganizationPlan`, `OrganizationSubscription`                                                                                  |
| quick-actions, preferred_language                                                          | `UserPreference`, `User.language`                                                                                                                                         |

## Open questions for Joni (decide before the matching tables are built)

1. **Travel statuses:** 6 (architecture guide) or 8 (requirements doc).
   `TripRequest.status` stays text until this is answered.
2. **Patient-controlled sharing:** which areas a member shares with which
   office, and the defaults. Today `ShareArea` is a first guess.
3. **Caregiver permissions:** the list of areas, and view vs edit for each.
   The journal defaults to No.
4. **Assigned referrals:** the access center wants "assigned to me" views,
   but no assignment model was given. `AccessReferral.assignedTo` is a
   placeholder.
5. **Staff roles** not on the client's lists (Physician, Care Coordinator,
   Medical Assistant, Front Desk at the dialysis center) still need sign-off.
6. **Transplant center:** in the spec and the enum, but not built anywhere.
7. **Record retention and deletion:** how long PHI is kept, and whether
   "delete" means a soft delete or a real one.

## Deliberately left as text, not enums

Role names, statuses whose list the client is still changing, and
bilingual option lists that live in code (`ACTIVITY_TYPES`, `CONCERN_KINDS`
and so on) are `String` columns with the allowed values named in a
comment. The API validates them with the same Zod schema the frontend uses.
Turn a column into an enum once its list is final.
