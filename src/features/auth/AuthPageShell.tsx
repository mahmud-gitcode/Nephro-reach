"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { useAuthText } from "./authText";

/* The frame of every Phase 2 auth page (two-factor, verify, reset, setup):
   one centred card, design-system parts only. Login and registration keep
   their own branded design. */
export function AuthPageShell({
  title,
  description,
  children,
  backToSignIn = true,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  backToSignIn?: boolean;
}) {
  const t = useAuthText();
  return (
    <main
      data-canvas
      className="flex min-h-screen w-full flex-col items-center justify-center bg-canvas px-inset-md py-stack-xl"
    >
      <div className="w-full max-w-[480px]">
        <p className="mb-stack-md text-center text-heading-4 text-fg-brand">
          NephroReach
        </p>
        <Card>
          <h1 className="text-heading-4 text-fg">{title}</h1>
          {description ? (
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {description}
            </p>
          ) : null}
          <div className="mt-stack-lg">{children}</div>
        </Card>
        {backToSignIn ? (
          <p className="mt-stack-md text-center text-body-sm">
            <Link href="/login" className="text-fg-brand hover:underline">
              {t("common.backToSignIn")}
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
