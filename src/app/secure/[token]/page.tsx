import React from "react";
import SecureSharePage from "@/features/secure-messages/SecureSharePage";
import { QueryProvider } from "@/lib/data/QueryProvider";

/* The page a "Share Outside NephroReach" link opens. No login: the
   recipient has no NephroReach account. They verify, then see only what
   was shared (client, 2026-10-05). */
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div data-typeface="portal" data-canvas className="min-h-screen bg-canvas">
      <QueryProvider>
        <SecureSharePage token={token} />
      </QueryProvider>
    </div>
  );
}
