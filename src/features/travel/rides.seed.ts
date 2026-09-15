import type { RideContact } from "./rides.types";

/* The list a member sees before they have saved anything of their own.
   Seed data lives in its own file so it is obvious what is demo content and
   can be deleted in one commit when real accounts arrive. */
export const SEED_RIDES: RideContact[] = [
  {
    id: "seed-primary-driver",
    name: "Bobo boy",
    phone: "(684) 555-0102",
    isPrimary: true,
  },
];
