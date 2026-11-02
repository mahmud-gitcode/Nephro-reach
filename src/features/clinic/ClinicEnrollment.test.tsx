import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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
import { apiRoster, officeContext, testPatientId } from "./rosterTestData";

/* Enroll Patients against a stand-in API (Phase 8): the real hooks, the
 * real form, the real two-call enrollment. Only fetch and the router are
 * stood in for. Synthetic office, people, ids and MRNs. */

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic/enroll-patients",
  useParams: () => ({}),
}));

const { default: ClinicEnrollment } = await import("./ClinicEnrollment");

const ORG = officeContext().memberships[0].organizationId;
const { patients, enrollments } = apiRoster();
const roster = (call: StubCall) =>
  call.method === "GET" && call.path === `/organizations/${ORG}/patients`;
const programs = (call: StubCall) =>
  call.path === `/organizations/${ORG}/program-enrollments`;
const rosterPost = (call: StubCall) =>
  call.method === "POST" && call.path === `/organizations/${ORG}/patients`;

function api(extra: StubHandler = () => undefined, context = officeContext()) {
  return stubApi((call) => {
    const answer = extra(call);
    if (answer) return answer;
    if (roster(call)) return pageOf(patients);
    if (programs(call) && call.method === "GET") return pageOf(enrollments);
    if (call.path === `/organizations/${ORG}/billing/contract`)
      return { data: { seats: { used: 5, allowed: 30, available: 25 } } };
    if (call.path === "/courses") return pageOf([]);
    return undefined;
  }, context);
}

function renderPage(url = "") {
  search = new URLSearchParams(url);
  window.history.replaceState(null, "", "/dashboard/clinic/enroll-patients");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>
          <ClinicEnrollment />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  replace.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const showing = () => screen.findByText(/^Showing \d+–\d+ of \d+ patients$/);

async function openForm() {
  await userEvent.click(
    (await screen.findAllByRole("button", { name: /Enroll New Patient/ }))[0],
  );
  return screen.getByRole("dialog", { name: "Enroll New Patient" });
}

async function fill(dialog: HTMLElement, name: string, mrn: string) {
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: /Full name/ }),
    name,
  );
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: /MRN/ }),
    mrn,
  );
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Enroll Patient" }),
  );
}

describe("the roster read", () => {
  it("lists the office's patients from the API, keyed by the office", async () => {
    const { calls } = api();
    renderPage();
    expect(await showing()).toHaveTextContent("of 5 patients");
    const read = calls.find(roster)!;
    expect(read.query.get("status")).toBe("ACTIVE");
    expect(Number(read.query.get("limit"))).toBeLessThanOrEqual(150);
    /* Office mode: the header names the office the path names. */
    expect(read.headers["x-organization-id"]).toBe(ORG);
    /* No MRN, email or name in any URL. */
    for (const call of calls)
      expect(`${call.path}?${call.query}`).not.toMatch(/9000\d\d|@|Avery/);
    /* Seats are the contract's. */
    expect(screen.getByText("5 of 30 enrolled")).toBeInTheDocument();
  });

  it("shows a failed read as an error, never as an empty roster", async () => {
    api((call) => (roster(call) ? apiError(500, null) : undefined));
    renderPage();
    expect(
      await screen.findByText("Enrollments could not be loaded"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No patients enrolled yet"),
    ).not.toBeInTheDocument();
  });

  it("shows the no-access state for a role without patients read (403)", async () => {
    api(
      (call) =>
        roster(call)
          ? apiError(403, "access.insufficient_permission")
          : undefined,
      officeContext({ patients: 0, programs: 1 }),
    );
    renderPage();
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });
});

describe("enrolling a patient: two server calls", () => {
  it("explains what is missing before sending anything", async () => {
    const { calls } = api();
    renderPage();
    const dialog = await openForm();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enroll Patient" }),
    );
    expect(
      within(dialog).getByText("Enter the patient's full name."),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("An MRN is 6 digits.")).toBeInTheDocument();
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("puts them on the roster, then in the program, and re-reads", async () => {
    const newId = testPatientId(77);
    const { calls } = api((call) => {
      if (rosterPost(call))
        return {
          status: 201,
          data: { patientId: newId, mrn: "700001", status: "ACTIVE" },
        };
      if (call.method === "POST" && programs(call))
        return { status: 201, data: { ...enrollments[0], patientId: newId } };
      return undefined;
    });
    renderPage();
    await showing();
    const dialog = await openForm();
    await fill(dialog, "Riley Q. Synthetic", "700001");

    expect(
      await screen.findByText("Riley Q. Synthetic is enrolled."),
    ).toBeInTheDocument();
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts.map((c) => c.path)).toEqual([
      `/organizations/${ORG}/patients`,
      `/organizations/${ORG}/program-enrollments`,
    ]);
    /* Split on the last space; no email or phone is sent (D11). */
    expect(posts[0].body).toEqual({
      firstName: "Riley Q.",
      lastName: "Synthetic",
      mrn: "700001",
    });
    expect(posts[1].body).toEqual({
      patientId: newId,
      program: "journey-21-day",
      source: "office-referral",
    });
    /* The success link names the patient by id. */
    expect(
      screen.getByRole("link", { name: "View on the Member page" }),
    ).toHaveAttribute("href", `/dashboard/clinic/members?patient=${newId}`);
    /* Re-read after the write: the roster was asked for again. */
    expect(calls.filter(roster).length).toBeGreaterThan(1);
  });

  it("shows a taken MRN (409) on the MRN field", async () => {
    api((call) =>
      rosterPost(call) ? apiError(409, "patients.mrn_taken") : undefined,
    );
    renderPage();
    const dialog = await openForm();
    await fill(dialog, "Riley Synthetic", "900001");
    expect(
      await within(dialog).findByText(
        "A patient with this MRN is already enrolled.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a full contract (409 seats_full) on the name field", async () => {
    api((call) =>
      rosterPost(call) ? apiError(409, "patients.seats_full") : undefined,
    );
    renderPage();
    const dialog = await openForm();
    await fill(dialog, "Riley Synthetic", "700002");
    expect(
      await within(dialog).findByText("All contract seats are filled."),
    ).toBeInTheDocument();
  });

  it("after ① succeeds and ② fails, says so and retries ② only", async () => {
    const newId = testPatientId(78);
    let programFails = true;
    const { calls } = api((call) => {
      if (rosterPost(call))
        return { status: 201, data: { patientId: newId, mrn: "700003" } };
      if (call.method === "POST" && programs(call))
        return programFails
          ? apiError(500, null)
          : { status: 201, data: { ...enrollments[0], patientId: newId } };
      return undefined;
    });
    renderPage();
    const dialog = await openForm();
    await fill(dialog, "Riley Synthetic", "700003");
    expect(
      await within(dialog).findByText(
        "Patient added, program enrollment failed",
      ),
    ).toBeInTheDocument();

    programFails = false;
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enroll Patient" }),
    );
    expect(
      await screen.findByText("Riley Synthetic is enrolled."),
    ).toBeInTheDocument();
    const programPosts = calls.filter(
      (c) => c.method === "POST" && programs(c),
    );
    /* Never re-POST ① (it would 409 patient_already_enrolled). */
    expect(calls.filter(rosterPost)).toHaveLength(1);
    expect(programPosts).toHaveLength(2);
    expect(programPosts[1].body).toMatchObject({ patientId: newId });
  });

  it("has no accessibility violations with a server error on a field", async () => {
    api((call) =>
      rosterPost(call) ? apiError(409, "patients.mrn_taken") : undefined,
    );
    renderPage();
    const dialog = await openForm();
    await fill(dialog, "Riley Synthetic", "900001");
    await within(dialog).findByText(
      "A patient with this MRN is already enrolled.",
    );
    expect(await axe(dialog)).toHaveNoViolations();
  });
});

describe("filtering from the panels", () => {
  it("narrows the table by referral source, and writes it to the URL", async () => {
    api();
    renderPage();
    await showing();
    await userEvent.click(screen.getByRole("button", { name: /^Self-Pay/ }));
    expect(await showing()).toHaveTextContent("of 1 patients");
    expect(replace).toHaveBeenLastCalledWith(
      "/dashboard/clinic/enroll-patients?source=Self-Pay",
      { scroll: false },
    );
  });

  it("starts filtered when the link says so", async () => {
    api();
    renderPage("status=Pending+Start");
    expect(await showing()).toHaveTextContent("of 1 patients");
  });
});
