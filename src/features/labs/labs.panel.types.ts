import type React from "react";

/* ==========================================================================
   Lab results — the shapes the panels read
   --------------------------------------------------------------------------
   Reference data, not the member's own entries: what each test is, what the
   range is, and which way the last reading moved. The member's own typed
   draw lives in labs.types.ts and comes through the data layer.
   ========================================================================== */

export type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type TestResult = {
  id: string;
  name: string;
  latestResult: string;
  previousResult: string;
  change: string;
  changeDirection: "up" | "down";
  changeColor: "red" | "green" | "orange";
  refRange: string;
  status: "In Range" | "High" | "Low";
  sparkline: number[];
};

export type CategoryGroup = {
  id: string;
  name: string;
  icon: IconType;
  tests: TestResult[];
};
