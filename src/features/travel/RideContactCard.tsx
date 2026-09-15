"use client";

import React from "react";
import { Phone, Pencil, Star, Trash2 } from "lucide-react";
import { Badge, Button, buttonStyles, Card } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import type { RideContact } from "./rides.types";

/** One saved driver. Lifted out of the page so the page reads as a layout. */
export function RideContactCard({
  ride,
  onEdit,
  onDelete,
}: {
  ride: RideContact;
  onEdit: () => void;
  /** Omitted for the last remaining contact — a member must keep one ride. */
  onDelete?: () => void;
}) {
  const { t } = useLanguage();

  return (
    <Card
      as="article"
      className={`flex flex-col justify-between gap-inline-lg ${
        ride.isPrimary ? "border-primary-soft-line bg-primary-soft" : ""
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-heading-5 ${
                ride.isPrimary
                  ? "bg-primary-solid text-primary-on-solid"
                  : "bg-surface-sunken text-fg-secondary"
              }`}
            >
              {ride.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-heading-5 text-fg">{ride.name}</h3>
              <div className="mt-stack-xs flex flex-wrap items-center gap-inline-xs">
                {ride.isPrimary && (
                  <Badge tone="info" icon={<Star />}>
                    {t("myRides.primaryBadge")}
                  </Badge>
                )}
                {ride.note && <Badge tone="neutral">{ride.note}</Badge>}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              iconOnly
              onClick={onEdit}
              aria-label={`Edit ${ride.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="danger"
                appearance="fill-stroke"
                size="small"
                iconOnly
                onClick={onDelete}
                aria-label={`Remove ${ride.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-stack-lg border-t border-line-subtle pt-inset-sm">
          <p className="text-overline text-fg-muted">
            {t("myRides.phoneLabel") || "Phone Number"}
          </p>
          <p className="mt-stack-xs text-metric-sm text-fg">{ride.phone}</p>
        </div>
      </div>

      <a
        href={`tel:${ride.phone.replace(/[^0-9+]/g, "")}`}
        className={buttonStyles({ fullWidth: true })}
      >
        <Phone />
        <span>
          {t("myRides.call")} {ride.name}
        </span>
      </a>
    </Card>
  );
}

export default RideContactCard;
