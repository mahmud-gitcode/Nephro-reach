"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enrollPatient,
  readAllPatients,
  type EnrollmentDraft,
} from "./enrollment.store";
import { curriculumRowFor } from "./curriculumProgress.data";
import { upcomingClasses } from "./liveClass.data";
import { recentActivity, rosterMemberFor } from "./members.data";

export const clinicDataKey = ["clinic", "roster"] as const;

/**
 * The clinic's shared reads: the enrolled patients (the demo roster plus
 * anyone enrolled in this browser), each as a member row, their recent
 * activity, and the class schedule. The Dashboard and the Member page both use it, so they
 * share one cache — a refresh on one is fresh on the other.
 *
 * It is demo data today, but it arrives through a query on purpose. The
 * read is asynchronous, so the pages' loading, error and retry states
 * are real now and tested now, instead of first meeting a Promise on the day
 * the API lands. That day, the body of `readClinicData` changes and nothing
 * that renders it does — the same bargain as lib/data/storage.ts.
 */
async function readClinicData() {
  const patients = await readAllPatients();
  return {
    /** Enrollment records — what Enroll Patients lists. */
    patients,
    /** The same people as member rows — what the Member page lists. */
    roster: patients.map(rosterMemberFor),
    /** The same people as curriculum rows — what Curriculum Progress lists. */
    curriculum: patients.map(curriculumRowFor),
    activity: recentActivity,
    classes: upcomingClasses,
  };
}

export type ClinicData = Awaited<ReturnType<typeof readClinicData>>;

export function useClinicData() {
  const query = useQuery({
    queryKey: clinicDataKey,
    queryFn: readClinicData,
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    /** When the data on screen was read; 0 until the first read lands. */
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
  };
}

/**
 * Enrolls a patient, then re-reads the clinic data so every page that shows
 * the roster — counts, charts, the Member page — includes them at once.
 */
export function useEnrollPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: EnrollmentDraft) => enrollPatient(draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicDataKey }),
  });
}
