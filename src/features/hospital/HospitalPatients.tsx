"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  SearchField,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { useCan } from "@/features/staff/useStaffAccounts";
import { useHospital } from "./useHospital";
import {
  accessUntil,
  educationStatus,
  programById,
  type HospitalEnrollment,
} from "./hospital.data";
import {
  DayDots,
  DiagnosisBadge,
  EditEnrollmentModal,
  EducationBadge,
  EnrollModal,
  EnrollmentBadge,
  shortDay,
} from "./HospitalUi";

/* ==========================================================================
   Hospital Patients — enrollment and management
   --------------------------------------------------------------------------
   The patients enrolled through this hospital only (client, 2026-10-13):
   when they were enrolled, newly diagnosed or already on dialysis, their
   program and where they are in it, and their enrollment status — which
   staff with the permission can update.
   ========================================================================== */

const HREF = "/dashboard/hospital/patients";

export default function HospitalPatients() {
  const hospital = useHospital();
  const canEnroll = useCan("hospital.enroll");
  const canAssign = useCan("hospital.education.assign");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [education, setEducation] = useState("all");
  const [enrolling, setEnrolling] = useState(false);
  const [editing, setEditing] = useState<HospitalEnrollment | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hospital.enrollments.filter(
      (e) =>
        (status === "all" || e.status === status) &&
        (education === "all" || educationStatus(e) === education) &&
        (!q || e.patientName.toLowerCase().includes(q) || e.mrn.includes(q)),
    );
  }, [hospital.enrollments, query, status, education]);

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        action={
          canEnroll ? (
            <Button leadingIcon={<Plus />} onClick={() => setEnrolling(true)}>
              Enroll patient
            </Button>
          ) : null
        }
      />

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-inline-md p-card sm:flex-row sm:flex-wrap sm:items-end">
          <SearchField
            label="Search patients"
            placeholder="Name or MRN…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:w-72"
          />
          <Select
            aria-label="Enrollment status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="sm:w-60"
          >
            <option value="all">All enrollment statuses</option>
            <option value="admitted">Admitted</option>
            <option value="discharged">Discharged</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
          <Select
            aria-label="Education status"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="sm:w-60"
          >
            <option value="all">All education statuses</option>
            <option value="not-started">Not started</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        {hospital.isPending ? (
          <div className="p-card pt-0">
            <Skeleton height={240} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No patients here"
            description={
              hospital.enrollments.length === 0
                ? "Enroll a patient to start their education."
                : "No patient matches these filters."
            }
          />
        ) : (
          <Table minWidth={980}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Kidney status</TableHeaderCell>
                <TableHeaderCell>Program</TableHeaderCell>
                <TableHeaderCell>Enrolled</TableHeaderCell>
                <TableHeaderCell>Enrollment</TableHeaderCell>
                <TableHeaderCell>Education</TableHeaderCell>
                <TableHeaderCell>Access until</TableHeaderCell>
                {canEnroll ? (
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell emphasis>
                    <span className="block">{e.patientName}</span>
                    <span className="block text-caption font-normal text-fg-muted">
                      MRN {e.mrn}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DiagnosisBadge diagnosis={e.diagnosis} />
                  </TableCell>
                  <TableCell>
                    {programById(e.programId)?.nameEn ?? e.programId}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {shortDay(e.enrolledAt)}
                  </TableCell>
                  <TableCell>
                    <EnrollmentBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-inline-sm">
                      <DayDots enrollment={e} />
                      <EducationBadge enrollment={e} />
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {e.status === "admitted"
                      ? "While admitted"
                      : shortDay(accessUntil(e))}
                  </TableCell>
                  {canEnroll ? (
                    <TableCell>
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        iconOnly
                        aria-label={`Update ${e.patientName}`}
                        onClick={() => setEditing(e)}
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {enrolling ? (
        <EnrollModal
          existing={hospital.enrollments}
          onEnroll={hospital.enroll}
          onClose={() => setEnrolling(false)}
        />
      ) : null}
      {editing ? (
        <EditEnrollmentModal
          enrollment={editing}
          canAssign={canAssign}
          onSave={(change) => hospital.update(editing.id, change)}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
