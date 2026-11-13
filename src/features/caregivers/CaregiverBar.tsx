"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, Check, ChevronDown, Users } from "lucide-react";
import {
  Button,
  Card,
  buttonStyles,
  menuItemStyles,
  menuStyles,
} from "@/components/ui";
import { CAREGIVER_HOME } from "@/features/auth/auth";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguageCode } from "@/context/LanguageContext";
import { availableContexts } from "@/features/auth/auth.mapping";
import { labelFor } from "@/features/portal/portalContext";
import { usePortalText } from "@/features/portal/portalText";
import { useDismiss } from "@/lib/utils/useDismiss";
import { cn } from "@/lib/utils/cn";
import { relationshipLabel } from "./caregivers.mapping";
import { useCaregiverView } from "./useCaregivers";

/* ==========================================================================
   The bar above every portal page (Phase 3)
   --------------------------------------------------------------------------
   - A caregiver: the patient they are acting for, by name, so it is never
     in doubt whose account they are changing, and the switch between the
     patients they look after. A switch is a new portal context
     (AuthContext.enterContext): every cached query is cleared first. With
     no patient chosen, member pages send them to My Patients.
   - An account with several portals (D5): which one is open, and the way to
     /select-portal. The sidebar and header are protected UI, so the switch
     lives here.
   What a caregiver opens is recorded by the server, under their own name.
   ========================================================================== */

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

/** "You are working in …" with a link to the picker, for accounts that
 *  hold more than one portal. */
function PortalLine() {
  const { context, choice } = useAuth();
  const t = usePortalText();
  const pathname = usePathname();
  if (!context || !choice || availableContexts(context).length <= 1)
    return null;
  const label = labelFor(context, choice, t);
  const name =
    choice.kind === "caregiver" && !choice.grantId
      ? t("caregiver", { name: "" }).trim()
      : label.title;
  return (
    <div className="mb-stack-md flex flex-wrap items-center justify-between gap-inline-sm text-body-sm text-fg-muted">
      <p className="min-w-0 truncate">
        {t("switchLabel", { name })}
        {label.suspended ? ` · ${t("suspended")}` : ""}
      </p>
      <Link
        href={`/select-portal?next=${encodeURIComponent(pathname)}`}
        className={buttonStyles({
          size: "small",
          variant: "neutral",
          appearance: "fill-stroke",
        })}
      >
        <ArrowLeftRight aria-hidden="true" className="size-4" />
        {t("switch")}
      </Link>
    </div>
  );
}

export function CaregiverBar() {
  const { user } = useAuth();
  const isEs = useLanguageCode() === "ES";
  const { grant, patients, choose, isCaregiver } = useCaregiverView();
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === CAREGIVER_HOME;
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const wrapRef = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => {
    if (isCaregiver && !grant && !onHome) router.replace(CAREGIVER_HOME);
  }, [isCaregiver, grant, onHome, router]);

  return (
    <>
      <PortalLine />
      {isCaregiver && grant ? (
        <Card
          as="section"
          padding="small"
          aria-label={
            isEs ? "Paciente a quien cuida" : "Patient you are caring for"
          }
          className="mb-stack-lg flex items-center gap-inline-md"
        >
          <PatientAvatar name={grant.patientName} />
          <div className="min-w-0 flex-1">
            <p className="text-caption text-fg-muted">
              {isEs ? "Usted cuida a" : "You are caring for"}
            </p>
            <p className="truncate text-label-lg text-fg">
              {grant.patientName}
            </p>
            <p className="hidden truncate text-caption text-fg-muted sm:block">
              {isEs ? (
                <>
                  Sesión iniciada como {user?.name} · los cambios se guardan en
                  la cuenta de {grant.patientName}, a su nombre
                </>
              ) : (
                <>
                  Signed in as {user?.name} · changes save to{" "}
                  {grant.patientName}
                  &apos;s account, under your name
                </>
              )}
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
                  {isEs ? "Cambiar" : "Switch"}
                  <span className="max-sm:hidden">
                    {isEs ? " de paciente" : " patient"}
                  </span>
                </span>
              </Button>

              {open ? (
                <div
                  role="menu"
                  aria-label={isEs ? "Cambiar de paciente" : "Switch patient"}
                  className={cn(
                    menuStyles,
                    "right-0 w-72 max-w-[calc(100vw-2rem)]",
                  )}
                >
                  <p className="px-3 pt-1.5 pb-2 text-caption text-fg-muted">
                    {isEs ? "Cambiar a" : "Switch to"}
                  </p>
                  {patients.map((p) => {
                    const current = p.grantId === grant.grantId;
                    return (
                      <button
                        key={p.grantId}
                        type="button"
                        role="menuitemradio"
                        aria-checked={current}
                        onClick={() => {
                          setOpen(false);
                          if (!current) choose(p.grantId);
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
                            {relationshipLabel(p.relationship, isEs)}
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
                      {isEs ? "Mis pacientes" : "My Patients"}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}
