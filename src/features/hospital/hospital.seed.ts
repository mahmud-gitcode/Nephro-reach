import { DEMO_MEMBER_EMAIL, DEMO_MEMBER_NAME } from "@/lib/data/demoIdentity";
import {
  addDays,
  type HospitalEnrollment,
  type HospitalState,
} from "./hospital.data";

/* The demo hospital's sample patients. Kept apart and loaded only when a
   browser has no saved hospital data, so the sample does not ride along
   in every hospital page's code. */

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Sample patients for the demo hospital, dated from today. */
export function seedHospital(now: number): HospitalState {
  const today = iso(new Date(now));
  const at = (days: number, hour = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const base = {
    hospitalId: "riverside-general",
    programId: "crash-3",
    enrolledBy: "Grace Nolan, RN",
  };
  const done = (...days: Array<[number, number]>) =>
    Object.fromEntries(
      days.map(([day, offset]) => [
        day,
        {
          completedAt: at(offset),
          knowledgeCheck: { score: 4, total: 5, passed: true },
        },
      ]),
    );
  const rows: HospitalEnrollment[] = [
    {
      ...base,
      id: "henr-seed-1",
      patientName: DEMO_MEMBER_NAME,
      patientEmail: DEMO_MEMBER_EMAIL,
      mrn: "223344",
      diagnosis: "new",
      enrolledAt: addDays(today, -4),
      status: "discharged",
      dischargedAt: addDays(today, -2),
      progress: done([1, -3]),
      lastActivityAt: at(-3),
    },
    {
      ...base,
      id: "henr-seed-2",
      patientName: "Maria Gonzalez",
      patientEmail: "maria.gonzalez@example.com",
      mrn: "558201",
      diagnosis: "new",
      enrolledAt: addDays(today, -1),
      status: "admitted",
      progress: {},
    },
    {
      ...base,
      id: "henr-seed-3",
      patientName: "Robert Chen",
      patientEmail: "robert.chen@example.com",
      mrn: "558377",
      diagnosis: "on-dialysis",
      enrolledAt: addDays(today, -9),
      status: "discharged",
      dischargedAt: addDays(today, -6),
      progress: done([1, -8], [2, -7], [3, -6]),
      lastActivityAt: at(-6),
    },
    {
      ...base,
      id: "henr-seed-4",
      patientName: "Denise Walker",
      patientEmail: "denise.walker@example.com",
      mrn: "558412",
      diagnosis: "new",
      enrolledAt: addDays(today, -3),
      status: "admitted",
      progress: done([1, -2], [2, -1]),
      lastActivityAt: at(-1),
      enrolledBy: "Tasha Greene, LCSW",
    },
    {
      ...base,
      id: "henr-seed-5",
      patientName: "Samuel Brooks",
      patientEmail: "samuel.brooks@example.com",
      mrn: "557990",
      diagnosis: "on-dialysis",
      enrolledAt: addDays(today, -40),
      status: "discharged",
      dischargedAt: addDays(today, -36),
      progress: done([1, -39]),
      lastActivityAt: at(-39),
    },
    {
      ...base,
      id: "henr-seed-6",
      patientName: "Angela Price",
      patientEmail: "angela.price@example.com",
      mrn: "557812",
      diagnosis: "new",
      enrolledAt: addDays(today, -35),
      status: "discharged",
      dischargedAt: addDays(today, -31),
      progress: done([1, -34], [2, -33], [3, -32]),
      lastActivityAt: at(-32),
      enrolledBy: "Omar Haddad",
    },
    {
      ...base,
      id: "henr-seed-7",
      patientName: "Luis Ramirez",
      patientEmail: "luis.ramirez@example.com",
      mrn: "558509",
      diagnosis: "on-dialysis",
      enrolledAt: today,
      status: "admitted",
      progress: {},
    },
  ];
  return { enrollments: rows };
}
