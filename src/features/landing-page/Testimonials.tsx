"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Review,
  getApprovedReviews,
  REVIEWS_EVENT,
} from "@/features/reviews/reviews";

export default function Testimonials() {
  const { t } = useLanguage();
  const [approvedList, setApprovedList] = useState<Review[]>([]);

  useEffect(() => {
    const syncReviews = () => {
      setApprovedList(getApprovedReviews());
    };
    syncReviews();
    window.addEventListener(REVIEWS_EVENT, syncReviews);
    window.addEventListener("storage", syncReviews);
    return () => {
      window.removeEventListener(REVIEWS_EVENT, syncReviews);
      window.removeEventListener("storage", syncReviews);
    };
  }, []);

  const defaultReviews = useMemo(
    () => [
      {
        id: "default-1",
        badge: t("testimonials.badge1") || "Dialysis Journey",
        quote: t("testimonials.quote1"),
        rating: "4.9",
        name: "Marcus J.",
        location: "United States",
        role: t("testimonials.role1"),
      },
      {
        id: "default-2",
        badge: t("testimonials.badge2") || "Caregiver Support",
        quote: t("testimonials.quote2"),
        rating: "4.8",
        name: "Angela R.",
        location: "United States",
        role: t("testimonials.role2"),
      },
      {
        id: "default-3",
        badge: t("testimonials.badge3") || "CKD Management",
        quote: t("testimonials.quote3"),
        rating: "5.0",
        name: "Cynthia L.",
        location: "United States",
        role: t("testimonials.role3"),
      },
    ],
    [t],
  );

  const reviews = useMemo(() => {
    if (approvedList.length > 0) {
      return approvedList.map((r) => ({
        id: r.id,
        badge: r.role || "Member Review",
        quote: r.comment.startsWith("“") ? r.comment : `“${r.comment}”`,
        rating: (r.rating || 5).toFixed(1),
        name: r.userName,
        location: r.location || "United States",
        role: r.role || "Community Member",
      }));
    }
    return defaultReviews;
  }, [approvedList, defaultReviews]);

  /* A banner, not a section (client, 2026-10-05): the reviews run past in
     one row. The row is drawn twice so the loop has no seam; the second
     copy is hidden from screen readers. */
  const card = (review: (typeof reviews)[number], copy: number) => (
    <article
      key={`${review.id}-${copy}`}
      aria-hidden={copy > 0 || undefined}
      className="font-manrope flex w-[340px] shrink-0 flex-col gap-3 rounded-[20px] border border-[#E5E7EB] bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <div className="flex">
          {[0, 1, 2, 3, 4].map((star) => (
            <img
              key={star}
              src="/images/home/star.svg"
              alt=""
              className={`size-4 ${
                star < Math.round(Number(review.rating))
                  ? "opacity-100"
                  : "opacity-25 grayscale"
              }`}
            />
          ))}
        </div>
        <span className="text-sm leading-5 font-semibold text-[#6B7280]">
          {review.rating}
        </span>
        <span className="ml-auto inline-flex rounded-md bg-[#EEFBF4] px-2 py-0.5 text-xs leading-5 font-medium text-[#3F9A61]">
          {review.badge}
        </span>
      </div>
      <p className="line-clamp-3 text-sm leading-6 font-medium text-[#23262F]">
        {review.quote}
      </p>
      <p className="text-sm leading-5 font-semibold text-[#23262F]">
        {review.name}
        <span className="font-normal text-[#6B7280]"> · {review.location}</span>
      </p>
    </article>
  );

  return (
    <section
      aria-label={t("testimonials.title")}
      className="w-full border-y border-[#E2E8F0] bg-[#F8FAFF] py-6"
    >
      <div className="landing-marquee-wrap w-full overflow-hidden">
        <div className="landing-marquee flex w-max gap-4 px-4">
          {reviews.map((review) => card(review, 0))}
          {reviews.map((review) => card(review, 1))}
        </div>
      </div>
    </section>
  );
}
