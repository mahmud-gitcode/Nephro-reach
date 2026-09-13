"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Review, getApprovedReviews, REVIEWS_EVENT } from "@/features/reviews/reviews";

export default function Testimonials() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
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
    [t]
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

  const len = reviews.length;
  const visible =
    len <= 3
      ? reviews
      : [
          reviews[index % len],
          reviews[(index + 1) % len],
          reviews[(index + 2) % len],
        ];

  return (
    <section className="w-full bg-white py-16 lg:py-20">
      <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-8 px-5 sm:px-8 lg:px-12 min-[1344px]:px-0">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between landing-reveal">
          <div className="w-full space-y-4">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[0.18px] text-[#0F172A] sm:text-[36px]">
              {t("testimonials.title")}
            </h2>
            <p className="text-lg font-medium leading-7 tracking-[0.1px] text-[#344056] sm:text-xl">
              {t("testimonials.subtitle")}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              aria-label="Previous testimonials"
              onClick={() =>
                setIndex((value) => (value - 1 + reviews.length) % reviews.length)
              }
              className="flex size-12 items-center justify-center rounded-full bg-[#1D4ED8] transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
            >
              <img src="/images/home/arrow-left.svg" alt="" className="size-6" />
            </button>
            <button
              type="button"
              aria-label="Next testimonials"
              onClick={() => setIndex((value) => (value + 1) % reviews.length)}
              className="flex size-12 items-center justify-center rounded-full bg-[#1D4ED8] transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
            >
              <img
                src="/images/home/arrow-right.svg"
                alt=""
                className="size-6"
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((review, cardIndex) => {
            const delays = ["delay-75", "delay-150", "delay-225"];
            return (
              <article
                key={`${review.name}-${cardIndex}-${index}`}
                className={`flex flex-col items-start gap-4 rounded-[24px] border border-[#E5E7EB] bg-white p-5 font-manrope hover:shadow-lg hover:border-blue-300 landing-reveal card-smooth-hover ${delays[cardIndex] || ""}`}
              >
                <span className="inline-flex w-fit rounded-md bg-[#EEFBF4] px-2 py-1 text-sm font-medium leading-5 text-[#58BD7D]">
                  {review.badge}
                </span>
                <p className="text-base font-medium leading-6 text-[#23262F]">
                  {review.quote}
                </p>
                <div className="flex h-7 w-[152px] items-center gap-2 py-0.5">
                  <div className="flex flex-1 items-start">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <img
                        key={star}
                        src="/images/home/star.svg"
                        alt=""
                        className={`size-6 ${
                          star < Math.round(Number(review.rating))
                            ? "opacity-100"
                            : "opacity-25 grayscale"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-base font-semibold leading-6 text-[#6B7280]">
                    {review.rating}
                  </span>
                </div>
                <div className="mt-auto flex w-full items-center gap-4">
                  <img
                    src="/images/home/testimonial-avatar.png"
                    alt=""
                    className="size-12 shrink-0 rounded-full object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="text-sm font-semibold leading-5 text-[#23262F]">
                      {review.name}, {review.location}
                    </p>
                    <p className="font-inter text-sm font-normal leading-6 text-[#777E90]">
                      {review.role}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
