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

/* Spanish for every string above, keyed by the English (the English stays
   the source; a string missing here shows in English). */
const ES: Record<string, string> = {
  Hospital: "Hospital",
  "Dialysis Center": "Centro de diálisis",
  "Vascular Access Center": "Centro de acceso vascular",
  "Nephrology Office": "Consultorio de nefrología",
  "See each patient's access record and status":
    "Ver el registro y el estado del acceso de cada paciente",
  "See open concerns and photos the patient sent to them":
    "Ver las inquietudes abiertas y las fotos que el paciente les envió",
  "Send a referral to the access center":
    "Enviar una derivación al centro de acceso vascular",
  "Take part in the patient's three-way access conversation":
    "Participar en la conversación a tres partes sobre el acceso del paciente",
  "Schedule, confirm or reschedule access appointments":
    "Programar, confirmar o reprogramar citas de acceso",
  "Update referral or coordination status":
    "Actualizar el estado de la derivación o de la coordinación",
  "Arrange transport for an access procedure":
    "Coordinar el transporte para un procedimiento de acceso",
  "See concerns the patient sent only to the access center":
    "Ver las inquietudes que el paciente envió solo al centro de acceso vascular",
  Patients: "Pacientes",
  "Dashboard / Overview": "Panel / Resumen",
  "Patient list": "Lista de pacientes",
  "Enroll patients": "Inscribir pacientes",
  "Mark patient as newly diagnosed / on dialysis":
    "Marcar al paciente como recién diagnosticado / en diálisis",
  "Update enrollment status (admitted / discharged / withdrawn)":
    "Actualizar el estado de inscripción (ingresado / dado de alta / retirado)",
  Education: "Educación",
  "3-Day Kidney Failure Crash Course":
    "Curso intensivo de 3 días sobre insuficiencia renal",
  "Finish the 3-Day course: 21-Day course + platform free for 45 days, then subscribe":
    "Al terminar el curso de 3 días: curso de 21 días + plataforma gratis por 45 días, luego suscripción",
  "21-Day course progress": "Progreso del curso de 21 días",
  "Assign an education program to a patient":
    "Asignar un programa educativo a un paciente",
  "Live classes": "Clases en vivo",
  Care: "Atención",
  "Patient check-ins": "Seguimientos de pacientes",
  "Labs (view / CSV upload)": "Laboratorios (ver / cargar CSV)",
  "CCM (Chronic Care Management) time log":
    "Registro de tiempo de CCM (Manejo de Atención Crónica)",
  "Vascular access: view": "Acceso vascular: ver",
  "Vascular access: concerns, photos, appointments":
    "Acceso vascular: inquietudes, fotos, citas",
  "Send referrals": "Enviar derivaciones",
  "Receive referrals": "Recibir derivaciones",
  "Travel dialysis": "Diálisis en viaje",
  "Rides / transportation": "Traslados / transporte",
  "ER visit reports": "Informes de visitas a urgencias",
  Messages: "Mensajes",
  "Message patients": "Enviar mensajes a pacientes",
  "Message other organizations": "Enviar mensajes a otras organizaciones",
  "Share outside NephroReach (secure link)":
    "Compartir fuera de NephroReach (enlace seguro)",
  Office: "Consultorio",
  Reports: "Informes",
  "Live counts on the Access Patients workspace (open referrals, concerns, appointments)":
    "Conteos en tiempo real en el espacio de Pacientes de acceso (derivaciones abiertas, inquietudes, citas)",
  'The "See reports" permission exists for the administrator, office manager and billing staff':
    'El permiso "Ver informes" existe para el administrador, el gerente de oficina y el personal de facturación',
  "A separate Reports page": "Una página de Informes aparte",
  "Downloadable reports (CSV)": "Informes descargables (CSV)",
  "Monthly education report + CSV download":
    "Informe educativo mensual + descarga en CSV",
  "Contract & billing": "Contrato y facturación",
  Settings: "Configuración",
  "Support (contact NephroReach)": "Soporte (contactar a NephroReach)",
  "Staff & roles": "Personal y roles",
  "Add / manage staff": "Agregar / administrar personal",
  "Built-in staff roles": "Roles de personal predefinidos",
  "Create new roles": "Crear roles nuevos",
  "Turn each role's features on / off":
    "Activar / desactivar las funciones de cada rol",
  "Main login (hospital@)": "Cuenta principal (hospital@)",
  "Main login (clinic@)": "Cuenta principal (clinic@)",
  "Main login (access@)": "Cuenta principal (access@)",
  "Main login (nephrology@)": "Cuenta principal (nephrology@)",
  "Main login, Hospital Administrator":
    "Cuenta principal, Administrador del hospital",
  "Main login, Office Manager": "Cuenta principal, Gerente de oficina",
  "Main login, Access Center Administrator, Office Manager":
    "Cuenta principal, Administrador del centro de acceso vascular, Gerente de oficina",
  "Main login, Office Manager, Administrator":
    "Cuenta principal, Gerente de oficina, Administrador",
};

/** A string of this data in the reader's language. */
export function localize(text: string, isEs: boolean): string {
  return isEs ? (ES[text] ?? text) : text;
}
