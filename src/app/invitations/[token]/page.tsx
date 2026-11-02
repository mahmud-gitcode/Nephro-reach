import type { Metadata } from "next";
import { InvitationPage } from "@/features/portal/InvitationPage";

/* A staff (D3) or caregiver (D1) invitation link. The token is a bearer
   secret in the path: never indexed, never sent on as a Referer. The
   matching response headers (no-store, no-referrer) belong in
   next.config.ts (Lead delegation, like /secure/:path*). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div data-typeface="portal" className="contents">
      <InvitationPage token={token} />
    </div>
  );
}
