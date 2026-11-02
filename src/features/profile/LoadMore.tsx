"use client";

import React from "react";
import { Button } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

/** "Load more" under a paged list, shown only while the server says there
 *  is more (ADR 0007 §3: one page is never assumed to be everything). */
export function LoadMore({
  read,
}: {
  read: { hasMore: boolean; loadMore: () => void; isLoadingMore: boolean };
}) {
  const { language } = useLanguage();
  if (!read.hasMore) return null;
  return (
    <div className="flex justify-center pt-stack-sm">
      <Button
        variant="neutral"
        appearance="fill-stroke"
        size="small"
        loading={read.isLoadingMore}
        onClick={read.loadMore}
      >
        {language === "ES" ? "Cargar más" : "Load more"}
      </Button>
    </div>
  );
}
