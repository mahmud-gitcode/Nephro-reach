import type {
  CareTeamContact,
  Conversation,
  Message,
  MessageAuthor,
} from "./messaging.types";

/* ==========================================================================
   Messaging — the demo inbox
   --------------------------------------------------------------------------
   Ten threads, as specified by the client.

   Timestamps are generated relative to the moment the seed runs rather than
   pinned to calendar dates, so "10:24 AM" is always today and "Yesterday"
   is always yesterday however long the demo sits unopened. The day gaps
   between the older threads match the dates in the spec (Sep 7, 6, 5, 5, 4,
   3, 2 against a Sep 20 today), so the list reads in the order given.
   ========================================================================== */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ISO for `msAgo` milliseconds before `now`. */
function ago(now: number, msAgo: number) {
  return new Date(now - msAgo).toISOString();
}

/**
 * Ids are derived from the thread and the message's place in it rather than
 * random, so a re-seed produces the same ids and React keys stay stable
 * across a reload.
 */
function msg(
  threadId: string,
  index: number,
  author: MessageAuthor,
  body: string,
  sentAt: string,
  attachment?: Message["attachment"],
): Message {
  return { id: `${threadId}-m${index}`, author, body, sentAt, attachment };
}

/**
 * The clinic end of every thread the facility holds.
 *
 * One object, shared by reference across all ten threads: the facility is
 * the same correspondent in each, and ten copies of its name would be ten
 * places to miss when it is renamed. Matches the clinic demo account in
 * `auth.ts`, so signing in as the clinic and as the member shows two ends
 * of the same conversation rather than two unrelated centres.
 */
const FACILITY: CareTeamContact = {
  name: "Riverside Dialysis Center",
  role: "Your Dialysis Care Team",
  kind: "facility",
  online: true,
};

/**
 * The member whose portal the demo signs into.
 *
 * Frontend-only means there is no account linking a login to a chart, so
 * the member inbox is pinned to one seeded name. When a server arrives this
 * becomes the signed-in user's id and `memberConversations` stops needing a
 * constant at all.
 */
export const DEMO_MEMBER = "John Taylor";

const CARE_TEAM = {
  provider: {
    name: "Melissa Carter, NP",
    role: "Provider",
    kind: "person",
    online: false,
  },
  nurse: {
    name: "Nurse Wilson",
    role: "Dialysis Nurse",
    kind: "person",
    online: true,
  },
  dietitian: {
    name: "Rachel Adams, RD",
    role: "Renal Dietitian",
    kind: "person",
    online: false,
  },
  social: {
    name: "Tanya Green, LMSW",
    role: "Social Worker",
    kind: "person",
    online: false,
  },
  frontDesk: {
    name: "Front Desk",
    role: "Scheduling",
    kind: "person",
    online: false,
  },
} satisfies Record<string, CareTeamContact>;

export function seedConversations(now: number): Conversation[] {
  return [
    {
      id: "john-taylor",
      memberName: "John Taylor",
      contact: FACILITY,
      category: "care-team",
      unread: 2,
      flagged: false,
      archived: false,
      patient: {
        dob: "05/14/1968",
        age: 58,
        mrn: "100245",
        phone: "(803) 555-2214",
        email: "jtaylor@email.com",
        program: "CKD Education",
        enrolledOn: "Jan 15, 2026",
        status: "Active",
        careTeam: "Dr. Carter, RN Wilson",
        notes: "Prefers morning communications",
      },
      messages: [
        msg(
          "john-taylor",
          1,
          "member",
          "Good morning! I had my lab work done yesterday. Can someone take a look and let me know if everything looks okay?",
          ago(now, 5 * HOUR),
        ),
        msg(
          "john-taylor",
          2,
          "clinic",
          "Good morning Mr. Taylor! We've received your lab results. Our nurse will review them and get back to you today. Thank you for staying on top of your health!",
          ago(now, 4 * HOUR - 12 * MINUTE),
        ),
        msg(
          "john-taylor",
          3,
          "member",
          "Thank you! Also, I've been having some swelling in my ankles. Should I adjust my fluid intake?",
          ago(now, 3 * HOUR - 9 * MINUTE),
        ),
        msg(
          "john-taylor",
          4,
          "clinic",
          "Thanks for letting us know. Please monitor your weight today and let us know if the swelling gets worse or if you have shortness of breath. I will send you our fluid management handout as a reminder.",
          ago(now, 3 * HOUR - 16 * MINUTE),
          { name: "Fluid Management Tips.pdf", sizeLabel: "1.2 MB" },
        ),
        msg(
          "john-taylor",
          5,
          "member",
          "I'll weigh myself tonight and let you know if anything changes.",
          ago(now, 2 * HOUR - 28 * MINUTE),
        ),
        msg(
          "john-taylor",
          6,
          "member",
          "Thank you for the information about fluid management — that handout is exactly what I needed.",
          ago(now, 2 * HOUR - 30 * MINUTE),
        ),
      ],
    },
    {
      id: "sandra-phillips",
      memberName: "Sandra Phillips",
      contact: FACILITY,
      category: "care-team",
      unread: 1,
      flagged: true,
      archived: false,
      patient: {
        dob: "11/02/1955",
        age: 70,
        mrn: "100312",
        phone: "(803) 555-8890",
        email: "sphillips@email.com",
        program: "Journey to Dialysis",
        enrolledOn: "Feb 03, 2026",
        status: "Active",
        careTeam: "Dr. Carter, RN Wilson",
        notes: "Hypertension — flag BP reports to the nurse",
      },
      messages: [
        msg(
          "sandra-phillips",
          1,
          "member",
          "My blood pressure has been high this week — 168 over 94 this morning, and it was similar yesterday.",
          ago(now, 6 * HOUR - 6 * MINUTE),
        ),
      ],
    },
    {
      id: "marcus-white",
      memberName: "Marcus White",
      contact: FACILITY,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      patient: {
        dob: "07/22/1979",
        age: 46,
        mrn: "100188",
        phone: "(803) 555-4417",
        email: "mwhite@email.com",
        program: "CKD Education",
        enrolledOn: "Jan 28, 2026",
        status: "Active",
        careTeam: "RN Wilson",
        notes: "Works nights — evening classes preferred",
      },
      messages: [
        msg(
          "marcus-white",
          1,
          "member",
          "Can I change my class time next month? The 6pm slot clashes with my shift.",
          ago(now, DAY + 2 * HOUR),
        ),
        msg(
          "marcus-white",
          2,
          "clinic",
          "Of course. We run the same session on Tuesday mornings — I can move you across from the 1st.",
          ago(now, DAY + 90 * MINUTE),
        ),
      ],
    },
    {
      id: "lisa-reynolds",
      memberName: "Lisa Reynolds",
      contact: FACILITY,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      patient: {
        dob: "03/09/1962",
        age: 63,
        mrn: "100407",
        phone: "(803) 555-7726",
        email: "lreynolds@email.com",
        program: "Journey to Dialysis",
        enrolledOn: "Dec 11, 2025",
        status: "Active",
        careTeam: "Dr. Carter",
        notes: "Sends labs monthly without prompting",
      },
      messages: [
        msg(
          "lisa-reynolds",
          1,
          "member",
          "Here are my latest labs.",
          ago(now, 13 * DAY),
          { name: "Labs Sep 2026.pdf", sizeLabel: "840 KB" },
        ),
      ],
    },
    {
      id: "daniel-brooks",
      memberName: "Daniel Brooks",
      contact: FACILITY,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      patient: {
        dob: "09/30/1971",
        age: 54,
        mrn: "100221",
        phone: "(803) 555-3308",
        email: "dbrooks@email.com",
        program: "CKD Education",
        enrolledOn: "Feb 19, 2026",
        status: "Active",
        careTeam: "RN Wilson",
        notes: "",
      },
      messages: [
        msg(
          "daniel-brooks",
          1,
          "clinic",
          "Your transport for Thursday is booked — pickup at 7:15am.",
          ago(now, 14 * DAY + HOUR),
        ),
        msg("daniel-brooks", 2, "member", "Thank you!", ago(now, 14 * DAY)),
      ],
    },
    {
      id: "maria-clark",
      memberName: "Maria Clark",
      contact: FACILITY,
      category: "care-team",
      unread: 1,
      flagged: false,
      archived: false,
      patient: {
        dob: "01/17/1984",
        age: 41,
        mrn: "100355",
        phone: "(803) 555-9902",
        email: "mclark@email.com",
        program: "Journey to Dialysis",
        enrolledOn: "Mar 02, 2026",
        status: "Active",
        careTeam: "Dietitian Ruiz",
        notes: "Dietitian follow-up requested",
      },
      messages: [
        msg(
          "maria-clark",
          1,
          "member",
          "I need help with my fluid intake. I'm over my limit most days and I'm not sure where it's coming from.",
          ago(now, 15 * DAY),
        ),
      ],
    },
    {
      id: "robert-turner",
      memberName: "Robert Turner",
      contact: FACILITY,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      patient: {
        dob: "06/25/1959",
        age: 66,
        mrn: "100290",
        phone: "(803) 555-1145",
        email: "rturner@email.com",
        program: "CKD Education",
        enrolledOn: "Jan 22, 2026",
        status: "Active",
        careTeam: "Dietitian Ruiz",
        notes: "",
      },
      messages: [
        msg(
          "robert-turner",
          1,
          "member",
          "What foods are high in potassium?",
          ago(now, 15 * DAY + 3 * HOUR),
        ),
        msg(
          "robert-turner",
          2,
          "clinic",
          "Bananas, potatoes, tomatoes and oranges are the usual ones. Day 6 of your programme has the full list.",
          ago(now, 15 * DAY + 2 * HOUR),
        ),
      ],
    },
    {
      id: "evelyn-green",
      memberName: "Evelyn Green",
      contact: FACILITY,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      patient: {
        dob: "12/05/1947",
        age: 78,
        mrn: "100163",
        phone: "(803) 555-6634",
        email: "egreen@email.com",
        program: "Journey to Dialysis",
        enrolledOn: "Nov 30, 2025",
        status: "Active",
        careTeam: "Dr. Carter, RN Wilson",
        notes: "Daughter is an authorised caregiver",
      },
      messages: [
        msg(
          "evelyn-green",
          1,
          "member",
          "I'll be at dialysis tomorrow.",
          ago(now, 16 * DAY),
        ),
      ],
    },
    {
      id: "kevin-walker",
      memberName: "Kevin Walker",
      contact: FACILITY,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: true,
      patient: {
        dob: "04/11/1990",
        age: 35,
        mrn: "100433",
        phone: "(803) 555-2278",
        email: "kwalker@email.com",
        program: "CKD Education",
        enrolledOn: "Mar 14, 2026",
        status: "Active",
        careTeam: "RN Wilson",
        notes: "",
      },
      messages: [
        msg(
          "kevin-walker",
          1,
          "member",
          "My transportation is confirmed.",
          ago(now, 17 * DAY),
        ),
      ],
    },
    {
      id: "tiffany-moore",
      memberName: "Tiffany Moore",
      contact: FACILITY,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: true,
      patient: {
        dob: "08/19/1975",
        age: 50,
        mrn: "100376",
        phone: "(803) 555-5521",
        email: "tmoore@email.com",
        program: "CKD Education",
        enrolledOn: "Feb 27, 2026",
        status: "Active",
        careTeam: "RN Wilson",
        notes: "",
      },
      messages: [
        msg(
          "tiffany-moore",
          1,
          "member",
          "Can you resend the handout?",
          ago(now, 18 * DAY),
        ),
      ],
    },

    /* ----------------------------------------------------------------
       The member's own threads.

       These have no `patient` block: they are not clinic queue work, and
       `clinicConversations` filters them out of that inbox by contact
       kind. They exist so the member portal has the several standing
       conversations a real one has, rather than a single thread with
       "the clinic".
       ---------------------------------------------------------------- */
    {
      id: "mt-provider",
      memberName: DEMO_MEMBER,
      contact: CARE_TEAM.provider,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      messages: [
        msg(
          "mt-provider",
          1,
          "clinic",
          "Hi John — I reviewed your labs from this week. Your phosphorus is trending down, which is exactly what we wanted to see. Keep doing what you are doing.",
          ago(now, 1 * DAY + 3 * HOUR),
        ),
        msg(
          "mt-provider",
          2,
          "member",
          "That is great news. Should I stay on the same binder dose?",
          ago(now, 1 * DAY + 2 * HOUR),
        ),
        msg(
          "mt-provider",
          3,
          "clinic",
          "Yes, no change for now. We will recheck in four weeks.",
          ago(now, 1 * DAY + 1 * HOUR),
        ),
      ],
    },
    {
      id: "mt-nurse",
      memberName: DEMO_MEMBER,
      contact: CARE_TEAM.nurse,
      category: "care-team",
      unread: 1,
      flagged: false,
      archived: false,
      messages: [
        msg(
          "mt-nurse",
          1,
          "clinic",
          "Don't forget to bring your full medication list to your next session — including anything over the counter.",
          ago(now, 3 * DAY),
        ),
        msg(
          "mt-nurse",
          2,
          "member",
          "Will do. Does that include vitamins?",
          ago(now, 3 * DAY - 40 * MINUTE),
        ),
        msg(
          "mt-nurse",
          3,
          "clinic",
          "It does. Vitamins and supplements count, and some of them interact with your binders.",
          ago(now, 2 * DAY - 6 * HOUR),
        ),
      ],
    },
    {
      id: "mt-dietitian",
      memberName: DEMO_MEMBER,
      contact: CARE_TEAM.dietitian,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      messages: [
        msg(
          "mt-dietitian",
          1,
          "member",
          "My potassium came back at 5.2. Do I need to make any changes to my diet?",
          ago(now, 5 * DAY),
        ),
        msg(
          "mt-dietitian",
          2,
          "clinic",
          "Good question. I would limit high potassium foods this week — I've attached a list for you. Let me know if you have any other questions.",
          ago(now, 5 * DAY - 90 * MINUTE),
          { name: "Low Potassium Foods.pdf", sizeLabel: "1.4 MB" },
        ),
        msg(
          "mt-dietitian",
          3,
          "member",
          "Thank you so much!",
          ago(now, 5 * DAY - 2 * HOUR),
        ),
      ],
    },
    {
      id: "mt-social",
      memberName: DEMO_MEMBER,
      contact: CARE_TEAM.social,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      messages: [
        msg(
          "mt-social",
          1,
          "clinic",
          "I pulled together the transportation resources we talked about — there is a county van program that covers dialysis trips.",
          ago(now, 8 * DAY),
        ),
        msg(
          "mt-social",
          2,
          "member",
          "That would help a lot. How do I apply?",
          ago(now, 8 * DAY - 3 * HOUR),
        ),
      ],
    },
    {
      id: "mt-front-desk",
      memberName: DEMO_MEMBER,
      contact: CARE_TEAM.frontDesk,
      category: "appointments",
      unread: 0,
      flagged: false,
      archived: false,
      messages: [
        msg(
          "mt-front-desk",
          1,
          "member",
          "Can I move my Thursday session to the morning slot?",
          ago(now, 11 * DAY),
        ),
        msg(
          "mt-front-desk",
          2,
          "clinic",
          "Done — you are booked for 7:00 AM Thursday. Your chair assignment stays the same.",
          ago(now, 11 * DAY - 2 * HOUR),
        ),
        msg(
          "mt-front-desk",
          3,
          "member",
          "Perfect, thank you.",
          ago(now, 11 * DAY - 3 * HOUR),
        ),
      ],
    },
    {
      id: "mt-front-desk-old",
      memberName: DEMO_MEMBER,
      contact: CARE_TEAM.frontDesk,
      category: "appointments",
      unread: 0,
      flagged: false,
      archived: true,
      messages: [
        msg(
          "mt-front-desk-old",
          1,
          "clinic",
          "Your appointment for last month has been confirmed. Please arrive 15 minutes early.",
          ago(now, 31 * DAY),
        ),
      ],
    },
  ];
}
