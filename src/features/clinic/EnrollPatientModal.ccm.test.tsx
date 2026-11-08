import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import {
  apiError,
  pageOf,
  stubApi,
  type StubCall,
  type StubHandler,
} from "@/features/profile/memberApiStub";
import { officeContext, testPatientId } from "./rosterTestData";
import { CCM_PROGRAM, EnrollPatientModal } from "./EnrollPatientModal";

/* P15a: CCM "enroll new" is two server calls, (1) the roster POST and (2)
   the CCM enrolment, not atomic. When (2) fails, the retry runs (2) for the
   patient (1) created (a second roster POST would be refused as
   patients.mrn_taken), with the name, MRN and date of birth locked.
   Synthetic office, person, ids and MRN. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/nephrology",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "0f0f0f0f-0000-4000-8000-0000000000cc";
const NEW_ID = testPatientId(91);
const NEPHROLOGY = (() => {
  const context = officeContext(
    { patients: 3, programs: 3, ccm: 3, billing: 1 },
    ORG,
  );
  context.memberships[0] = {
    ...context.memberships[0],
    /* offersCcm finds the office by name in the static list. */
    organizationName: "Riverside Nephrology Associates",
    organizationType: "NEPHROLOGY_OFFICE",
  };
  return context;
})();

const condition = (id: string, label: string) => ({
  id,
  entryId: null,
  label,
  short: label,
  group: "Cardiovascular",
  secondary: false,
  isDefault: true,
  active: true,
});

const rosterPost = (c: StubCall) =>
  c.method === "POST" && c.path === `/organizations/${ORG}/patients`;
const ccmPost = (c: StubCall) =>
  c.method === "POST" && c.path === `/organizations/${ORG}/ccm/enrollments`;

function api(extra: StubHandler) {
  return stubApi((c) => {
    const hit = extra(c);
    if (hit) return hit;
    if (c.path === `/organizations/${ORG}/ccm/conditions`)
      return {
        data: [
          condition("cond-a", "Synthetic condition A"),
          condition("cond-b", "Synthetic condition B"),
        ],
      };
    if (c.path === `/organizations/${ORG}/patients`) return pageOf([]);
    if (c.path === `/organizations/${ORG}/program-enrollments`)
      return pageOf([]);
    if (c.path === "/courses") return pageOf([]);
    return undefined;
  }, NEPHROLOGY);
}

function renderModal(onEnrolled = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>
          <EnrollPatientModal onClose={vi.fn()} onEnrolled={onEnrolled} />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
  return onEnrolled;
}

async function fillCcm() {
  /* The form is swapped for the CCM one once the signed-in office (CCM is
     offered to nephrology only) is known: read the dialog after that. */
  await waitFor(
    () =>
      expect(
        within(
          screen.getByRole("dialog", { name: "Enroll New Patient" }),
        ).getByRole("option", { name: CCM_PROGRAM }),
      ).toBeInTheDocument(),
    { timeout: 3_000 },
  );
  const dialog = screen.getByRole("dialog", { name: "Enroll New Patient" });
  await userEvent.selectOptions(
    within(dialog).getByRole("combobox", { name: /Program/ }),
    CCM_PROGRAM,
  );
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: /Full name/ }),
    "Riley Synthetic",
  );
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: /MRN/ }),
    "700091",
  );
  await userEvent.type(
    within(dialog).getByLabelText(/Date of birth/),
    "1960-01-02",
  );
  await userEvent.click(
    within(dialog).getByRole("button", { name: /Select conditions/ }),
  );
  await userEvent.click(
    await within(dialog).findByRole("checkbox", {
      name: /Synthetic condition A/,
    }),
  );
  await userEvent.click(
    within(dialog).getByRole("checkbox", { name: /Synthetic condition B/ }),
  );
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: /Provider/ }),
    "Dr. Synthetic",
  );
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: /Care manager/ }),
    "Nurse Synthetic",
  );
  return dialog;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("CCM enroll new: roster, then CCM, with a partial retry", () => {
  it("after the roster POST succeeds and the CCM step fails, the retry runs the CCM step only", async () => {
    let ccmFails = true;
    const { calls } = api((c) => {
      if (rosterPost(c))
        return { status: 201, data: { patientId: NEW_ID, mrn: "700091" } };
      if (ccmPost(c))
        return ccmFails
          ? apiError(500, null)
          : { status: 201, data: { patientId: NEW_ID, status: "ACTIVE" } };
      return undefined;
    });
    const onEnrolled = renderModal();
    const dialog = await fillCcm();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enroll in CCM" }),
    );
    expect(
      await within(dialog).findByText("Patient added, CCM enrollment failed"),
    ).toBeInTheDocument();
    expect(onEnrolled).not.toHaveBeenCalled();

    /* Name, MRN and date of birth went with the roster POST: locked. */
    for (const field of [
      within(dialog).getByRole("textbox", { name: /Full name/ }),
      within(dialog).getByRole("textbox", { name: /MRN/ }),
      within(dialog).getByLabelText(/Date of birth/),
    ])
      expect(field).toHaveAttribute("readonly");
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: /MRN/ }),
      "9",
    );
    expect(within(dialog).getByRole("textbox", { name: /MRN/ })).toHaveValue(
      "700091",
    );
    /* The retry stays CCM: no other program is offered. */
    expect(
      within(dialog)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toContain(CCM_PROGRAM);
    expect(
      within(
        within(dialog).getByRole("combobox", { name: /Program/ }),
      ).getAllByRole("option"),
    ).toHaveLength(1);
    expect(await axe(dialog)).toHaveNoViolations();

    ccmFails = false;
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enroll in CCM" }),
    );
    await waitFor(() =>
      expect(onEnrolled).toHaveBeenCalledWith("Riley Synthetic", null, true),
    );
    /* One roster POST only; the second CCM POST names the same patient. */
    expect(calls.filter(rosterPost)).toHaveLength(1);
    const ccmPosts = calls.filter(ccmPost);
    expect(ccmPosts).toHaveLength(2);
    expect(ccmPosts[1].body).toEqual({
      patientId: NEW_ID,
      conditions: ["cond-a", "cond-b"],
      providerName: "Dr. Synthetic",
      careManagerName: "Nurse Synthetic",
    });
  });

  it("a refused roster POST (taken MRN) is not a partial: nothing is locked", async () => {
    const { calls } = api((c) =>
      rosterPost(c) ? apiError(409, "patients.mrn_taken") : undefined,
    );
    renderModal();
    const dialog = await fillCcm();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enroll in CCM" }),
    );
    expect(await within(dialog).findByText("Not enrolled")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Patient added, CCM enrollment failed"),
    ).toBeNull();
    expect(
      within(dialog).getByRole("textbox", { name: /MRN/ }),
    ).not.toHaveAttribute("readonly");
    expect(calls.filter(ccmPost)).toHaveLength(0);
  });
});
