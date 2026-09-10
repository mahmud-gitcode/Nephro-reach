"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { CheckCircle2, Quote, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const reviewItems = [
  {
    quoteKey: "aboutUsPage.review1Quote",
    nameKey: "aboutUsPage.review1Name",
    roleKey: "aboutUsPage.review1Role",
  },
  {
    quoteKey: "aboutUsPage.review2Quote",
    nameKey: "aboutUsPage.review2Name",
    roleKey: "aboutUsPage.review2Role",
  },
  {
    quoteKey: "aboutUsPage.review3Quote",
    nameKey: "aboutUsPage.review3Name",
    roleKey: "aboutUsPage.review3Role",
  },
];

// Flag to toggle between placeholder images and real images.
// Set to false when user requests to unhide/import real images.
export const USE_PLACEHOLDER_IMAGES = true;

export const aboutImages = {
  founder: USE_PLACEHOLDER_IMAGES
    ? "/images/about us/placeholders/founder-placeholder.svg"
    : "/images/about us/aboutImage.png",
  panelist: USE_PLACEHOLDER_IMAGES
    ? "/images/about us/placeholders/panelist-placeholder.svg"
    : "/images/about us/panelListMember1.png",
  nutritionist: USE_PLACEHOLDER_IMAGES
    ? "/images/about us/placeholders/nutritionist-placeholder.svg"
    : "/images/about us/annette-weseman.png",
  mission: USE_PLACEHOLDER_IMAGES
    ? "/images/about us/placeholders/mission-placeholder.svg"
    : "/images/about us/our-mission.png",
};

export default function AboutUsPage() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white overflow-hidden">
      <Header />
      
      <main className="flex-grow w-full">
        
        {/* HERO SECTION (Text Only - No Image) */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-14 sm:py-18 lg:py-20 bg-gradient-to-b from-[#F0F7FF] via-[#F8FAFC] to-white border-b border-slate-100">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-widest text-[#2563EB] bg-blue-50 border border-blue-100 uppercase mb-4 shadow-2xs">
              {t("aboutUsPage.heroEyebrow")}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
              {t("aboutUsPage.heroTitle")}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mb-8">
              {t("aboutUsPage.heroSubtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {language === "ES" ? "Membresía" : "Membership"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {language === "ES" ? "Diario" : "Journal"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {language === "ES" ? "Clases en Vivo" : "Live Classes"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDER SECTION */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-[40px] font-bold text-slate-800 mb-6 leading-tight inline-block relative">
                {t("aboutUsPage.founderTitle")}
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#E5A8A3]" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
                </svg>
              </h2>
              
              <div className="space-y-6 text-slate-600 text-[16px] md:text-[17px] leading-relaxed font-medium">
                <p>{t("aboutUsPage.founderP1")}</p>
                <p>{t("aboutUsPage.founderP2")}</p>
                <p className="font-bold text-[#1a7f80] text-lg">
                  {t("aboutUsPage.founderP3")}
                </p>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-full aspect-square lg:aspect-[4/5]">
                <Image
                  src={aboutImages.founder}
                  alt={t("aboutUsPage.founderImageAlt")}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE OFFER */}
        <section className="w-full bg-[#F8FAFC] px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 text-center">{t("aboutUsPage.whatWeOfferTitle")}</h2>
            <p className="text-slate-600 text-[17px] leading-relaxed font-medium mb-10 text-center">
              {t("aboutUsPage.whatWeOfferSubtitle")}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                t("aboutUsPage.offer1"),
                t("aboutUsPage.offer2"),
                t("aboutUsPage.offer3"),
                t("aboutUsPage.offer4"),
                t("aboutUsPage.offer5"),
                t("aboutUsPage.offer6")
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-[#3AA5A5] shrink-0 mt-0.5" />
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PANELISTS SECTION */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-16 md:py-24 bg-white">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-[40px] font-bold text-slate-800 mb-4 inline-block relative">
              {t("aboutUsPage.panelistTitle")}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#E5A8A3]" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
              </svg>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="order-1 lg:order-1 flex justify-center">
              <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={aboutImages.panelist}
                  alt={t("aboutUsPage.panelistName")}
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>
            </div>

            <div className="order-2 lg:order-2">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{t("aboutUsPage.panelistName")}</h3>
              <p className="text-[#1a7f80] font-semibold text-lg mb-6">
                {t("aboutUsPage.panelistDesignation")}
              </p>
              
              <div className="space-y-4 text-slate-600 text-[16px] md:text-[17px] leading-relaxed font-medium mb-8">
                <p>
                  {t("aboutUsPage.panelistP1")}
                </p>
                <p>
                  {t("aboutUsPage.panelistP2")}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-lg mb-4">{t("aboutUsPage.panelistTopicsTitle")}</h4>
                <ul className="space-y-3">
                  {[
                    t("aboutUsPage.panelistTopic1"),
                    t("aboutUsPage.panelistTopic2"),
                    t("aboutUsPage.panelistTopic3"),
                    t("aboutUsPage.panelistTopic4"),
                    t("aboutUsPage.panelistTopic5"),
                    t("aboutUsPage.panelistTopic6"),
                    t("aboutUsPage.panelistTopic7")
                  ].map((topic, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#3AA5A5] shrink-0 mt-0.5" />
                      <span className="text-slate-600 font-medium">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* RENAL NUTRITION EXPERT SECTION */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-16 md:py-24 bg-[#F8FAFC]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-[#1a7f80] font-bold uppercase tracking-[0.18em] text-xs mb-3">
                {t("aboutUsPage.nutritionistBadge")}
              </p>
              <h2 className="text-3xl md:text-[40px] font-bold text-slate-800 mb-3 leading-tight inline-block relative">
                {t("aboutUsPage.nutritionistName")}
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#E5A8A3]" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
                </svg>
              </h2>
              <p className="text-[#1a7f80] font-semibold text-lg mb-6">
                {t("aboutUsPage.nutritionistDesignation")}
              </p>
              
              <p className="text-slate-600 text-[16px] md:text-[17px] leading-relaxed font-medium mb-8">
                {t("aboutUsPage.nutritionistBio")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  t("aboutUsPage.nutritionistHighlight1"),
                  t("aboutUsPage.nutritionistHighlight2"),
                  t("aboutUsPage.nutritionistHighlight3")
                ].map((item, index) => (
                  <div key={index} className="rounded-2xl border border-teal-100 bg-white px-4 py-4 shadow-sm">
                    <CheckCircle2 className="mb-3 h-5 w-5 text-[#3AA5A5]" />
                    <p className="text-sm font-semibold leading-snug text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-lg">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={aboutImages.nutritionist}
                    alt={t("aboutUsPage.nutritionistImageAlt")}
                    fill
                    className="object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS SECTION */}
        <section className="w-full bg-white px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="text-[#1a7f80] font-bold uppercase tracking-[0.18em] text-xs mb-3">
                {t("aboutUsPage.reviewsBadge")}
              </p>
              <h2 className="text-3xl md:text-[40px] font-bold text-slate-800 mb-4 leading-tight">
                {t("aboutUsPage.reviewsTitle")}
              </h2>
              <p className="text-slate-600 text-[16px] md:text-[17px] leading-relaxed font-medium">
                {t("aboutUsPage.reviewsSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {reviewItems.map((review, index) => (
                <article
                  key={review.nameKey}
                  className="relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex gap-1 text-[#E5A8A3]" aria-label="5 star review">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F7F7] text-[#1a7f80]">
                      <Quote className="h-5 w-5" />
                    </span>
                  </div>

                  <p className="mb-6 flex-grow text-slate-600 text-[15px] leading-relaxed font-medium">
                    &ldquo;{t(review.quoteKey)}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a7f80] text-sm font-bold text-white">
                      {index === 0 ? "AR" : index === 1 ? "MJ" : "CL"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{t(review.nameKey)}</h3>
                      <p className="text-sm font-medium text-slate-500">{t(review.roleKey)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ZIGZAG LIST: MISSION, VISION, NOTICE (Hidden until panelist photos/statements are ready) */}
        {false && (
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-20 lg:py-28 space-y-24">
          
          {/* Item 1: Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[4/3] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src={aboutImages.mission} alt="Our Mission" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-[28px] lg:text-3xl font-bold text-slate-900 mb-6">Our Mission</h3>
              <div className="space-y-4 text-slate-600 text-[16px] leading-relaxed font-medium">
                <p>
                  NephroReach is an educational platform dedicated to empowering individuals living with kidney disease and the caregivers who support them. Our mission is to provide easy-to-understand, reliable kidney education that helps people make informed decisions, build confidence, and better manage their health every day.
                </p>
                <p>
                  We believe education leads to empowerment, and empowered patients experience better outcomes.
                </p>
              </div>
            </div>
          </div>

          {/* Item 2: Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-[28px] lg:text-3xl font-bold text-slate-900 mb-6">Our Vision</h3>
              <p className="text-slate-600 text-[16px] leading-relaxed font-medium">
                Our vision is to become the leading kidney education platform that supports patients and caregivers through every stage of kidney disease. We strive to improve health literacy, reduce preventable hospitalizations, encourage active participation in care, and help individuals live healthier, more confident lives.
              </p>
            </div>
            <div className="order-1 md:order-2 relative w-full aspect-[4/3] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src={aboutImages.mission} alt="Our Vision" fill className="object-cover" />
            </div>
          </div>

          {/* Item 3: Important Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[4/3] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src={aboutImages.mission} alt="Important Notice" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-[28px] lg:text-3xl font-bold text-[#bd3d44] mb-6">Important Notice</h3>
              <p className="text-slate-600 text-[16px] leading-relaxed font-medium">
                NephroReach is an educational platform only. The information provided on this website is intended for educational purposes and should not replace medical advice, diagnosis, or treatment from your physician, nephrologist, dialysis care team, or other qualified healthcare provider. Always consult your healthcare provider regarding your individual medical care.
              </p>
            </div>
          </div>
          
        </section>
        )}

      </main>

      <Footer />
    </div>
  );
}
