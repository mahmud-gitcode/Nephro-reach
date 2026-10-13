/* ==========================================================================
   Portal Comparison — the data
   --------------------------------------------------------------------------
   What each organisation's portal has, as agreed with the client
   (2026-10-13, her review of this page). One source for the
   admin page and its PDF, so the two cannot disagree.
   ========================================================================== */

export type Limited = { included: string[]; notIncluded: string[] };
export type Cell = "yes" | "no" | Limited | number;
export type Portal = "hospital" | "dialysis" | "access" | "nephrology";

export const PORTALS: { id: Portal; name: string; login: string }[] = [
  { id: "hospital", name: "Hospital", login: "hospital@nephroreach.com" },
  { id: "dialysis", name: "Dialysis Center", login: "clinic@nephroreach.com" },
  {
    id: "access",
    name: "Vascular Access Center",
    login: "access@nephroreach.com",
  },
  {
    id: "nephrology",
    name: "Nephrology Office",
    login: "nephrology@nephroreach.com",
  },
];

/* The access work the dialysis center and nephrology office share in. */
const ACCESS_SIDE: Limited = {
  included: [
    "See each patient's access record and status",
    "See open concerns and photos the patient sent to them",
    "Send a referral to the access center",
    "Take part in the patient's three-way access conversation",
  ],
  notIncluded: [
    "Schedule, confirm or reschedule access appointments",
    "Update referral or coordination status",
    "Arrange transport for an access procedure",
    "See concerns the patient sent only to the access center",
  ],
};

/* The dialysis center also arranges the ride (client, 2026-10-13). */
const DIALYSIS_ACCESS_SIDE: Limited = {
  included: [
    ...ACCESS_SIDE.included,
    "Arrange transport for an access procedure",
  ],
  notIncluded: ACCESS_SIDE.notIncluded.filter(
    (item) => item !== "Arrange transport for an access procedure",
  ),
};

export type Row = { feature: string; cells: Record<Portal, Cell> };
export type Section = { title: string; rows: Row[] };

export const SECTIONS: Section[] = [
  {
    title: "Patients",
    rows: [
      {
        feature: "Dashboard / Overview",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Patient list",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Enroll patients",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Mark patient as newly diagnosed / on dialysis",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Update enrollment status (admitted / discharged / withdrawn)",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Education",
    rows: [
      {
        feature: "3-Day Kidney Failure Crash Course",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature:
          "Finish the 3-Day course: 21-Day course + platform free for 45 days, then subscribe",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "21-Day course progress",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Assign an education program to a patient",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Live classes",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Care",
    rows: [
      {
        feature: "Patient check-ins",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Labs (view / CSV upload)",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "CCM (Chronic Care Management) time log",
        cells: {
          hospital: "no",
          dialysis: "no",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Vascular access: view",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Vascular access: concerns, photos, appointments",
        cells: {
          hospital: "no",
          dialysis: DIALYSIS_ACCESS_SIDE,
          access: "yes",
          nephrology: ACCESS_SIDE,
        },
      },
      {
        feature: "Send referrals",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Receive referrals",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "yes",
          nephrology: "no",
        },
      },
      {
        feature: "Travel dialysis",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "no",
        },
      },
      {
        feature: "Rides / transportation",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "yes",
          nephrology: "no",
        },
      },
      {
        feature: "ER visit reports",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Messages",
    rows: [
      {
        feature: "Message patients",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Message other organizations",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Share outside NephroReach (secure link)",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Office",
    rows: [
      {
        feature: "Reports",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: {
            included: [
              "Live counts on the Access Patients workspace (open referrals, concerns, appointments)",
              'The "See reports" permission exists for the administrator, office manager and billing staff',
            ],
            notIncluded: [
              "A separate Reports page",
              "Downloadable reports (CSV)",
            ],
          },
          nephrology: "yes",
        },
      },
      {
        feature: "Monthly education report + CSV download",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Contract & billing",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Settings",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Support (contact NephroReach)",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Staff & roles",
    rows: [
      {
        feature: "Add / manage staff",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Built-in staff roles",
        cells: { hospital: 6, dialysis: 9, access: 8, nephrology: 9 },
      },
      {
        feature: "Create new roles",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Turn each role's features on / off",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
    ],
  },
];

export const CONTROL: {
  portal: string;
  roles: string;
  staff: string;
}[] = [
  {
    portal: "Hospital",
    roles: "Main login (hospital@)",
    staff: "Main login, Hospital Administrator",
  },
  {
    portal: "Dialysis Center",
    roles: "Main login (clinic@)",
    staff: "Main login, Office Manager",
  },
  {
    portal: "Vascular Access Center",
    roles: "Main login (access@)",
    staff: "Main login, Access Center Administrator, Office Manager",
  },
  {
    portal: "Nephrology Office",
    roles: "Main login (nephrology@)",
    staff: "Main login, Office Manager, Administrator",
  },
];
