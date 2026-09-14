"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LandingAnimationObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Ignore dashboard routes so dashboard remains untouched
    if (pathname?.startsWith("/dashboard")) return;

    // Fallback if IntersectionObserver not available
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      document
        .querySelectorAll(
          ".landing-reveal, .landing-reveal-left, .landing-reveal-right",
        )
        .forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add("is-revealed");
            obs.unobserve(el);

            // Clean up entrance delays after transition finishes so hover is instant
            setTimeout(() => {
              el.classList.remove(
                "delay-75",
                "delay-150",
                "delay-225",
                "delay-300",
                "delay-375",
                "delay-450",
              );
            }, 800);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "50px 0px 0px 0px",
      },
    );

    const elements = document.querySelectorAll(
      ".landing-reveal, .landing-reveal-left, .landing-reveal-right",
    );
    elements.forEach((el) => observer.observe(el));

    // Failsafe timer: Ensure that within 400ms of route change, any unrevealed element becomes visible
    const timer = setTimeout(() => {
      document
        .querySelectorAll(
          ".landing-reveal:not(.is-revealed), .landing-reveal-left:not(.is-revealed), .landing-reveal-right:not(.is-revealed)",
        )
        .forEach((el) => el.classList.add("is-revealed"));
    }, 450);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
