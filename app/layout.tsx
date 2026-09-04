import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NephroReach",
  description:
    "Understand your kidneys. Take control of your journey with NephroReach.",
};

import LandingAnimationObserver from "@/components/homePage/LandingAnimationObserver";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${inter.className} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
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
