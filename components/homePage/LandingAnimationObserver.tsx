"use client";

import { useEffect } from "react";

export default function LandingAnimationObserver() {
  useEffect(() => {
    // Check if IntersectionObserver is supported
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback: reveal all immediately if no IntersectionObserver
      const elements = document.querySelectorAll(
        ".landing-reveal, .landing-reveal-left, .landing-reveal-right"
      );
      elements.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add("is-revealed");
            obs.unobserve(el);

            // Clean up entrance delay classes after animation finishes so hover is immediately smooth
            setTimeout(() => {
              el.classList.remove(
                "delay-75",
                "delay-150",
                "delay-225",
                "delay-300",
                "delay-375",
                "delay-450"
              );
            }, 800);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const elements = document.querySelectorAll(
      ".landing-reveal, .landing-reveal-left, .landing-reveal-right"
    );
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
