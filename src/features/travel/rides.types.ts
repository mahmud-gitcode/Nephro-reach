/* ==========================================================================
   Rides — the shape of the data
   --------------------------------------------------------------------------
   Kept apart from the component that draws it and from the repository that
   stores it, because this is the one piece the backend will have an opinion
   about in a month. When the API arrives, this file is the diff: the fields
   it returns go here, and TypeScript then walks us to every place that
   assumed otherwise.
   ========================================================================== */

export interface RideContact {
  id: string;
  name: string;
  phone: string;
  /** Free text — "brother", "dialysis transit". Not a category. */
  note?: string;
  /** Exactly one saved contact is primary. The repository enforces it. */
  isPrimary?: boolean;
}

/** What a member can actually type. `id` and the primary invariant are ours. */
export type RideDraft = {
  name: string;
  phone: string;
  note?: string;
  isPrimary?: boolean;
};
