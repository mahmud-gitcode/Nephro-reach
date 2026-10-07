"use client";

import { useCallback } from "react";
import { useClinicSettings } from "@/features/clinic/useClinicSettings";
import {
  AFTER_HOURS_REPLY,
  DEFAULT_OFFICE_HOURS,
  isAfterHours,
} from "./messaging.rules";

/** The automated after-hours reply, when a message is sent now and the
 *  office is closed (client, 2026-10-07). The office sets its hours in
 *  Settings; 8:00 AM – 5:00 PM until it does. */
export function useAfterHoursReply(): () => string | undefined {
  const { settings } = useClinicSettings();
  const opensAt = settings.office.opensAt ?? DEFAULT_OFFICE_HOURS.opensAt;
  const closesAt = settings.office.closesAt ?? DEFAULT_OFFICE_HOURS.closesAt;
  return useCallback(
    () =>
      isAfterHours(new Date(), { opensAt, closesAt })
        ? AFTER_HOURS_REPLY
        : undefined,
    [opensAt, closesAt],
  );
}
