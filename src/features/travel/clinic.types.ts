/** The member's own dialysis center — the number they call when something is wrong. */
export interface DialysisClinic {
  name: string;
  phone: string;
  /**
   * Where the centre is, as one line the member would read out to a driver.
   *
   * Free text rather than street/city/state/zip parts: a member is copying
   * it off an appointment card, and four required boxes is four chances to
   * be stopped by a form over something they already have written down.
   */
  address: string;
}
