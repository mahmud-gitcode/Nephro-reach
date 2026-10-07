"use client";

import dynamic from "next/dynamic";

/* The Share Outside NephroReach form for pages other than Messages (logs,
   medications, travel). It only opens on a click, so it loads then, as one
   shared chunk, instead of being copied into every page that offers it. */
export const LazyShareOutsideModal = dynamic(
  () => import("./ShareOutsideCard").then((m) => m.ShareOutsideModal),
  { ssr: false },
);
