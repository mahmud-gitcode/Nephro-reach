import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { DayCard, kindLabel } from "./ClassroomDayCard";
import type { ClassroomLesson } from "@/features/education/classroom";
import { LanguageProvider } from "@/context/LanguageContext";

/* The lesson card moved out of the My Classroom page module (P15a QA L1).
   Synthetic lesson only. */

const LESSON = {
  slug: "synthetic-day-2",
  day: 2,
  kind: "video",
  titleEn: "Synthetic lesson",
  titleEs: "Lección sintética",
  summaryEn: "A synthetic summary.",
  summaryEs: "Un resumen sintético.",
  durationMinutes: 12,
  poster: "",
} as unknown as ClassroomLesson;

afterEach(() => cleanup());

describe("DayCard", () => {
  it("links to the lesson and shows its progress", async () => {
    const { container } = render(
      <LanguageProvider>
        <DayCard
          day={LESSON}
          state={{ status: "in-progress", percent: 40 } as never}
          itemWord="Day"
        />
      </LanguageProvider>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/my-classroom/synthetic-day-2",
    );
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Synthetic lesson")).toBeInTheDocument();
    expect(screen.getByText("Day 2")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("names each kind of class", () => {
    expect(kindLabel("audio", undefined)).toBe("Audio");
    expect(kindLabel("reading", undefined)).toBe("Reading");
    expect(kindLabel("exam", undefined)).toBe("Exam");
    expect(kindLabel("video", { typeVideo: "Vídeo" })).toBe("Vídeo");
  });
});
