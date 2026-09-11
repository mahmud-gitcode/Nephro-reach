import React from "react";
import PersonalLogDisclaimer from "@/components/dashboard/PersonalLogDisclaimer";

export default function PersonalLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PersonalLogDisclaimer />
      {children}
    </>
  );
}
