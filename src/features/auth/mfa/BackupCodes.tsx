"use client";

import React, { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { useAuthText } from "../authText";

/* Backup codes are shown once, right after they are made (first enrolment
   or regeneration). They live in this component's props only: never in
   storage, the query cache, the URL or a log. "Continue" stays disabled
   until the user says they saved them. */
export function BackupCodes({
  codes,
  onDone,
}: {
  codes: readonly string[];
  onDone: () => void;
}) {
  const t = useAuthText();
  const [saved, setSaved] = useState(false);
  return (
    <section aria-labelledby="backup-codes-title" className="space-y-stack-md">
      <h2 id="backup-codes-title" className="text-heading-5 text-fg">
        {t("mfa.backupTitle")}
      </h2>
      <Alert tone="warning">{t("mfa.backupIntro")}</Alert>
      <ul
        aria-label={t("mfa.backupTitle")}
        className="grid grid-cols-2 gap-inline-sm rounded-card-nested border border-line bg-surface-sunken p-inset-md font-mono text-body-md text-fg"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <label className="flex items-center gap-inline-sm text-body-sm text-fg">
        <input
          type="checkbox"
          className="size-5"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
        />
        {t("mfa.backupSaved")}
      </label>
      <Button fullWidth disabled={!saved} onClick={onDone}>
        {t("mfa.goOn")}
      </Button>
    </section>
  );
}
