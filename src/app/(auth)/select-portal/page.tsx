import type { Metadata } from "next";
import { SelectPortal } from "@/features/portal/SelectPortal";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return <SelectPortal />;
}
