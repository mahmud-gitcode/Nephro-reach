import { describe, expect, it } from "vitest";
import {
  accessProgress,
  milestones,
  updatePlan,
  type KidneyCarePlan,
} from "./kidneyCare";
import type {
  AccessAppointment,
  AccessRecord,
  AccessReferral,
} from "@/features/vascular-access/vascularAccess.data";

const record = (appointments: Partial<AccessAppointment>[]) =>
  ({
    appointments: appointments.map((a, i) => ({
      id: `a${i}`,
      date: "2026-10-10",
      time: "10:00",
      place: "Metro",
      team: "vascular",
      title: "Access Follow-Up",
      ...a,
    })),
  }) as AccessRecord;

const referral = { kind: "New Access Referral" } as AccessReferral;

describe("kidney care plan", () => {
  it("stamps every edit and clears an answer set back to blank", () => {
    let plan = updatePlan(
      undefined,
      { answers: { krtEducation: "Yes" } },
      "2026-10-03",
      "Maria Lopez, RN",
    );
    expect(plan).toMatchObject({
      answers: { krtEducation: "Yes" },
      updatedOn: "2026-10-03",
      updatedBy: "Maria Lopez, RN",
      ehrDocumented: false,
    });
    plan = updatePlan(
      plan,
      { answers: { krtEducation: undefined }, accessType: "AV fistula" },
      "2026-10-04",
      "Dr. Samuel Reed",
    );
    expect(plan.answers).toEqual({});
    expect(plan.accessType).toBe("AV fistula");
  });
});

describe("access progress", () => {
  it("starts only once the practice places a referral", () => {
    expect(accessProgress(undefined, [], record([{}]))).toBe(0);
    const marked: KidneyCarePlan = {
      answers: { accessReferral: "Yes" },
      ehrDocumented: false,
    };
    expect(accessProgress(marked, [], undefined)).toBe(1);
    expect(accessProgress(undefined, [referral], undefined)).toBe(1);
  });

  it("follows visits, then procedures, as the access center books them", () => {
    expect(accessProgress(undefined, [referral], record([{}]))).toBe(2);
    expect(
      accessProgress(
        undefined,
        [referral],
        record([{ completed: { result: "ok", performedBy: "x" } }]),
      ),
    ).toBe(3);
    expect(
      accessProgress(
        undefined,
        [referral],
        record([{ title: "Access Placement Surgery" }]),
      ),
    ).toBe(4);
    expect(
      accessProgress(
        undefined,
        [referral],
        record([
          {
            title: "Access Placement Surgery",
            completed: { result: "ok", performedBy: "x" },
          },
        ]),
      ),
    ).toBe(5);
  });
});

describe("milestones", () => {
  it("shows planning as partial until it is completed", () => {
    const plan: KidneyCarePlan = {
      answers: {
        krtEducation: "Yes",
        modalityDiscussion: "Yes",
        accessPlanning: "Yes",
        transplantReferral: "N/A",
      },
      ehrDocumented: true,
    };
    const states = Object.fromEntries(
      milestones(plan, 1).map((m) => [m.label, m.state]),
    );
    expect(states).toEqual({
      "CKD education": "done",
      "Modality education": "done",
      "Access planning initiated": "partial",
      "Vascular referral": "done",
      "Access appointment completed": "todo",
      "Transplant evaluation": "na",
    });
    expect(
      milestones(
        { ...plan, answers: { ...plan.answers, planningCompleted: "Yes" } },
        3,
      ).find((m) => m.label === "Access appointment completed")?.state,
    ).toBe("done");
  });
});
