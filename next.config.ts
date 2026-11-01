import type { NextConfig } from "next";

/* ==========================================================================
   Security headers (healthcare data: HIPAA technical safeguards)
   --------------------------------------------------------------------------
   The CSP lists only what the app uses today:
   - scripts, styles, fonts, /images and /videos from this origin
     (next/font self-hosts the fonts);
   - the NephroReach API (fetch, and images/files it serves);
   - blob: and data: for upload previews, CSV/PDF downloads and VTT captions;
   - YouTube (no-cookie) and Vimeo players for education videos.
   'unsafe-inline' stays for scripts because Next injects inline bootstrap
   scripts on statically rendered pages (a nonce would make every page
   dynamic), and for styles because components use style={...}.
   Portal pages also get no-store and noindex, so patient screens are not
   cached or indexed.
   ========================================================================== */

const isDev = process.env.NODE_ENV === "development";
const apiOrigin = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
).origin;

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${apiOrigin}`,
  `media-src 'self' blob: data: ${apiOrigin}`,
  "font-src 'self'",
  `connect-src 'self' ${apiOrigin}${isDev ? " ws://localhost:4000" : ""}`,
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  /* Not no-referrer: the YouTube player needs the origin to play. */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
];

const privatePageHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

/* Share and invitation links carry a bearer token in the path: never send
   the URL to another site. */
const tokenPageHeaders = [
  ...privatePageHeaders,
  { key: "Referrer-Policy", value: "no-referrer" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/dashboard", headers: privatePageHeaders },
      { source: "/dashboard/:path*", headers: privatePageHeaders },
      { source: "/secure/:path*", headers: tokenPageHeaders },
      { source: "/caregiver-invite/:path*", headers: tokenPageHeaders },
    ];
  },
};

export default nextConfig;
