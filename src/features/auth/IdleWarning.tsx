"use client";

/* ==========================================================================
   The idle warning (D2) and the absolute-limit notice
   --------------------------------------------------------------------------
   Rendered by AuthProvider while signed in. It runs one SessionTimer per
   tab (sessionTimer.ts): the server's deadlines from the passive
   `GET /auth/session`, a keep-alive only for real local activity, and a
   re-read before warning or ending (another tab may have been active).

   The warning needs an explicit choice: local activity does not dismiss it.
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Modal } from "@/components/ui";
import { fetchCurrentSession, touchSession } from "./auth.api";
import { useAuthText } from "./authText";
import { SessionTimer } from "./sessionTimer";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];
/* Local activity is noted at most this often. */
const ACTIVITY_THROTTLE_MS = 5_000;

function formatLeft(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function IdleWarning({
  onExpire,
  onSignOut,
}: {
  onExpire: () => void;
  onSignOut: () => void;
}) {
  const t = useAuthText();
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [absolute, setAbsolute] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<SessionTimer | null>(null);
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = new SessionTimer({
      read: fetchCurrentSession,
      touch: touchSession,
      onWarn: (at) => {
        setNow(Date.now());
        setDeadline(at);
      },
      onClear: () => setDeadline(null),
      onAbsoluteWarn: (at) => setAbsolute(at),
      onExpire: () => expireRef.current(),
    });
    timerRef.current = timer;
    void timer.start();

    let last = 0;
    const onActivity = () => {
      const t0 = Date.now();
      if (t0 - last < ACTIVITY_THROTTLE_MS) return;
      last = t0;
      timer.noteActivity();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void timer.visible();
    };
    for (const name of ACTIVITY_EVENTS)
      window.addEventListener(name, onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      timer.stop();
      timerRef.current = null;
      for (const name of ACTIVITY_EVENTS)
        window.removeEventListener(name, onActivity);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  /* A live countdown while the warning is open. */
  useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  const stay = async () => {
    setBusy(true);
    try {
      await timerRef.current?.stayActive();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {absolute ? (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-[560px]">
          <Alert tone="warning" onDismiss={() => setAbsolute(null)}>
            {t("idle.absolute", {
              time: absolute.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })}
          </Alert>
        </div>
      ) : null}
      <Modal
        open={deadline !== null}
        /* An explicit choice is required: Escape and the backdrop do
           nothing. */
        onClose={() => undefined}
        closeOnBackdrop={false}
        hideCloseButton
        size="small"
        title={t("idle.title")}
        footer={
          <>
            <Button
              variant="neutral"
              appearance="stroke"
              onClick={onSignOut}
              disabled={busy}
            >
              {t("idle.signOut")}
            </Button>
            <Button onClick={() => void stay()} loading={busy}>
              {t("idle.stay")}
            </Button>
          </>
        }
      >
        <p className="text-body-md text-fg" role="timer">
          {deadline
            ? t("idle.body", {
                time: formatLeft(deadline.getTime() - now),
              })
            : null}
        </p>
      </Modal>
    </>
  );
}
