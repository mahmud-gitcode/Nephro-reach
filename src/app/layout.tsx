import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "@/styles/globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";

/* Lato ships 100/300/400/700/900 — it has no 500 and no 600. The type
   scale is mapped onto the weights it does have; see tokens/typography.css. */
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "NephroReach",
  description:
    "Understand your kidneys. Take control of your journey with NephroReach.",
};

import LandingAnimationObserver from "@/features/landing-page/LandingAnimationObserver";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lato.variable} ${lato.className} h-full antialiased`}
    >
      <body className={`${lato.className} flex min-h-full flex-col`}>
        <LanguageProvider>
          <AuthProvider>
            <LandingAnimationObserver />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
