"use client";

import React, { useState } from "react";

const reviews = [
  {
    badge: "Student Moves",
    quote:
      "Applying for my visa was a breeze with NephroReach! The platform guided me every step and the support team was incredibly helpful.",
    rating: "4.8",
    name: "Priya Sharma",
    location: "India",
    role: "Freelance Writer",
  },
  {
    badge: "Student Moves",
    quote:
      "NephroReach helped me stay consistent with check-ins and journaling. I finally feel more in control of my kidney health journey.",
    rating: "4.8",
    name: "Priya Sharma",
    location: "India",
    role: "Freelance Writer",
  },
  {
    badge: "Student Moves",
    quote:
      "The classes and SMS prompts keep me engaged without overwhelm. It's simple, private, and actually useful every week.",
    rating: "4.8",
    name: "Priya Sharma",
    location: "India",
    role: "Freelance Writer",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const visible = [
    reviews[index % reviews.length],
    reviews[(index + 1) % reviews.length],
    reviews[(index + 2) % reviews.length],
  ];

  return (
    <section className="w-full bg-white px-5 py-16 sm:px-10 lg:px-20 lg:py-20">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[900px] space-y-4">
            <h2 className="text-[32px] font-semibold leading-[48px] text-[#0F172A] sm:text-[40px]">
              What Our Customers Say
            </h2>
            <p className="text-lg font-medium leading-7 text-[#344056] sm:text-xl">
              Real stories from people around the world using our platform to
              build, grow, and connect.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              aria-label="Previous testimonials"
              onClick={() =>
                setIndex((value) => (value - 1 + reviews.length) % reviews.length)
              }
              className="flex size-12 items-center justify-center rounded-full bg-[#1D4ED8]"
            >
              <img src="/images/home/arrow-left.svg" alt="" className="size-6" />
            </button>
            <button
              type="button"
              aria-label="Next testimonials"
              onClick={() => setIndex((value) => (value + 1) % reviews.length)}
              className="flex size-12 items-center justify-center rounded-full bg-[#1D4ED8]"
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
          {visible.map((review, cardIndex) => (
            <article
              key={`${review.name}-${cardIndex}-${index}`}
              className="flex flex-col gap-5 rounded-3xl border border-[#BBCFFD] bg-white p-5"
            >
              <span className="inline-flex w-fit rounded-md bg-[#EEFBF4] px-2.5 py-1 text-sm font-medium text-[#58BD7D]">
                {review.badge}
              </span>
              <p className="text-base font-medium leading-6 text-[#0F172A]">
                {review.quote}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/home/testimonial-avatar.png"
                    alt=""
                    className="size-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {review.name}, {review.location}
                    </p>
                    <p className="text-sm text-[#344056]">{review.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <img src="/images/home/star.svg" alt="" className="size-4" />
                  <span className="text-sm font-semibold text-[#0F172A]">
                    {review.rating}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
