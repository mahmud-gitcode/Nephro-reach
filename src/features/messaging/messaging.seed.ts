import type { Conversation, Message, MessageAuthor } from "./messaging.types";

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

export function seedConversations(now: number): Conversation[] {
  return [
    {
      id: "john-taylor",
      memberName: "John Taylor",
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
  ];
}
