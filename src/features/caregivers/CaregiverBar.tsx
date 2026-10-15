"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, Check, ChevronDown, Users } from "lucide-react";
import { Button, Card, menuItemStyles, menuStyles } from "@/components/ui";
import { getBreadcrumb } from "@/components/layout/navigation";
import { CAREGIVER_HOME } from "@/features/auth/auth";
import { useAuth } from "@/features/auth/AuthContext";
import { useDismiss } from "@/lib/utils/useDismiss";
import { cn } from "@/lib/utils/cn";
import { useCaregiverView } from "./useCaregivers";

/* ==========================================================================
   The caregiver's bar — whose account this is, and the switch
   --------------------------------------------------------------------------
   Above every page a caregiver opens (2026-10-14): the patient they are
   acting for, by name and initials, so it is never in doubt whose account
   they are changing — and, when they look after more than one, a switch
   that lists each patient with the current one ticked. With no patient
   chosen, every member page sends them to My Patients first. Each page
   they open goes into the patient's caregiver activity.
   ========================================================================== */

const HOUR = 60 * 60 * 1000;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function PatientAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-pill bg-primary-soft text-fg-brand",
        size === "md" ? "size-11 text-label-lg" : "size-8 text-label-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}

export function CaregiverBar() {
  const { user } = useAuth();
  const view = useCaregiverView();
  const { grant, patients, choose, log, isCaregiver, isPending } = view;
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === CAREGIVER_HOME;
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const wrapRef = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => {
    if (isCaregiver && !isPending && !grant && !onHome) {
      router.replace(CAREGIVER_HOME);
    }
  }, [isCaregiver, isPending, grant, onHome, router]);

  /* The patient sees what their caregiver opened, at most once an hour
     per page. */
  const logged = useRef("");
  useEffect(() => {
    if (!grant || onHome) return;
    const action = `Opened ${getBreadcrumb(pathname)}`;
    const key = `${grant.id}:${action}`;
    if (logged.current === key) return;
    logged.current = key;
    const recent = grant.activity.some(
      (a) => a.action === action && Date.now() - Date.parse(a.at) < HOUR,
    );
    if (!recent) log(grant.id, action);
  }, [grant, pathname, onHome, log]);

  if (!isCaregiver || !grant) return null;

  return (
    <Card
      as="section"
      padding="small"
      aria-label="Patient you are caring for"
      className="mb-stack-lg flex items-center gap-inline-md"
    >
      <PatientAvatar name={grant.patientName} />
      <div className="min-w-0 flex-1">
        <p className="text-caption text-fg-muted">You are caring for</p>
        <p className="truncate text-label-lg text-fg">{grant.patientName}</p>
        <p className="hidden truncate text-caption text-fg-muted sm:block">
          Signed in as {user?.name} · changes save to {grant.patientName}
          &apos;s account
        </p>
      </div>

      {patients.length > 1 ? (
        <div ref={wrapRef} className="relative shrink-0">
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<ArrowLeftRight />}
            trailingIcon={
              <ChevronDown
                className={cn(
                  "transition-transform duration-150 ease-standard",
                  open && "rotate-180",
                )}
              />
            }
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <span>
              Switch<span className="max-sm:hidden"> patient</span>
            </span>
          </Button>

          {open ? (
            <div
              role="menu"
              aria-label="Switch patient"
              className={cn(
                menuStyles,
                "right-0 w-72 max-w-[calc(100vw-2rem)]",
              )}
            >
              <p className="px-3 pt-1.5 pb-2 text-caption text-fg-muted">
                Switch to
              </p>
              {patients.map((p) => {
                const current = p.id === grant.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={current}
                    onClick={() => {
                      setOpen(false);
                      if (!current) void choose(p.patientEmail);
                    }}
                    className={cn(
                      menuItemStyles,
                      "text-fg hover:bg-surface-sunken",
                      current && "bg-surface-sunken",
                    )}
                  >
                    <PatientAvatar name={p.patientName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-label-md">
                        {p.patientName}
                      </span>
                      <span className="block truncate text-caption text-fg-muted">
                        {p.relationship}
                      </span>
                    </span>
                    {current ? (
                      <Check
                        aria-hidden="true"
                        className="size-4 shrink-0 text-fg-brand"
                      />
                    ) : null}
                  </button>
                );
              })}
              <div className="mt-1.5 border-t border-line pt-1.5">
                <Link
                  href={CAREGIVER_HOME}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={cn(
                    menuItemStyles,
                    "text-fg hover:bg-surface-sunken",
                  )}
                >
                  <Users aria-hidden="true" className="size-4 shrink-0" />
                  My Patients
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
