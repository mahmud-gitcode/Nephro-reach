"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Activity,
  ArrowRight,
  BellRing,
  ChevronDown,
  GraduationCap,
  HeartHandshake,
  Stethoscope,
  Video,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const USE_PLACEHOLDER_IMAGES = false;

export const aboutImages = {
  founder: "/images/about us/New/aboutImage.png",
  panelist: "/images/about us/New/panelListMember.png",
  nutritionist: "/images/about us/New/annette-weseman1.png",
};

const heroFeatureCards = [
  {
    id: "membership",
    titleEn: "Membership",
    titleEs: "Membresía",
    descEn: "Plans & 7-Day Free Trial",
    descEs: "Planes y 7 Días Gratis",
    bgGradient: "from-blue-50/90 via-blue-50/40 to-white",
    hangingRotation: "-rotate-[2.5deg]",
    stringClass: "h-3.5 sm:h-4.5",
  },
  {
    id: "journal",
    titleEn: "Digital Journal",
    titleEs: "Diario Digital",
    descEn: "Daily Reflections & Notes",
    descEs: "Reflexión Diaria y Notas",
    bgGradient: "from-emerald-50/90 via-emerald-50/40 to-white",
    hangingRotation: "-rotate-[1.5deg]",
    stringClass: "h-5 sm:h-6.5",
  },
  {
    id: "live-classes",
    titleEn: "Live Classes",
    titleEs: "Clases en Vivo",
    descEn: "Expert Sessions & Q&A",
    descEs: "Sesiones con Expertos",
    bgGradient: "from-purple-50/90 via-purple-50/40 to-white",
    hangingRotation: "-rotate-[0.5deg]",
    stringClass: "h-6.5 sm:h-8",
  },
  {
    id: "education-center",
    titleEn: "Education Center",
    titleEs: "Centro Educativo",
    descEn: "Videos & CKD Library",
    descEs: "Videos y Biblioteca Renal",
    bgGradient: "from-amber-50/90 via-amber-50/40 to-white",
    hangingRotation: "rotate-0",
    stringClass: "h-7 sm:h-9",
  },
  {
    id: "health-trackers",
    titleEn: "Health Trackers",
    titleEs: "Monitor de Salud",
    descEn: "BP, Fluids, Weight & Labs",
    descEs: "Presión, Líquidos y Labs",
    bgGradient: "from-rose-50/90 via-rose-50/40 to-white",
    hangingRotation: "rotate-[0.5deg]",
    stringClass: "h-6.5 sm:h-8",
  },
  {
    id: "before-the-er",
    titleEn: "Before-the-ER",
    titleEs: "Antes de Urgencias",
    descEn: "Symptom Alerts & Guidance",
    descEs: "Alertas y Signos Clave",
    bgGradient: "from-sky-50/90 via-sky-50/40 to-white",
    hangingRotation: "rotate-[1.5deg]",
    stringClass: "h-5 sm:h-6.5",
  },
  {
    id: "21-day-journey",
    titleEn: "21-Day Journey",
    titleEs: "Jornada de 21 Días",
    descEn: "Guided Dialysis Curriculum",
    descEs: "Curso Guiado de Diálisis",
    bgGradient: "from-teal-50/90 via-teal-50/40 to-white",
    hangingRotation: "rotate-[2.5deg]",
    stringClass: "h-3.5 sm:h-4.5",
  },
];

export default function AboutUsPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [expandedMatilta, setExpandedMatilta] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <Header />

      <main className="w-full flex-grow">
        {/* 01 — EDITORIAL HERO: BRAND PURPOSE */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F2F8FD] via-[#F9FBFC] to-white pt-14 pb-16 sm:pt-20 sm:pb-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-8 md:px-[60px] lg:px-12 xl:px-16">
            <h1 className="mb-6 max-w-5xl text-3xl leading-[1.18] font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[52px] lg:whitespace-nowrap xl:text-6xl">
              {isEs ? (
                <>
                  La atención renal no debería detenerse{" "}
                  <span className="bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent">
                    en la puerta de la clínica.
                  </span>
                </>
              ) : (
                <>
                  Kidney care shouldn’t stop{" "}
                  <span className="bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent">
                    at the clinic.
                  </span>
                </>
              )}
            </h1>

            <p className="mb-8 max-w-3xl text-lg leading-relaxed font-medium text-slate-600 sm:text-xl lg:text-2xl">
              {isEs
                ? "NephroReach ayuda a personas que viven con enfermedad renal y a sus cuidadores a aprender, organizarse y sentirse más preparados entre consultas y durante todo su camino de salud."
                : "NephroReach helps people living with kidney disease and their caregivers learn, stay organized, and feel more prepared between appointments and throughout their care journey."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#experts"
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-base font-bold text-white shadow-md shadow-blue-500/15 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
              >
                <span>
                  {isEs ? "Conocer a Nuestros Expertos" : "Meet Our Experts"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* 7 Key Feature Cards (Full Width Hanging / Suspended Cards across Left to Right) */}
          <div className="relative mt-10 w-full overflow-hidden pt-2 pb-6 sm:mt-14">
            {/* Hanging Wire across full width */}
            <div className="pointer-events-none absolute top-[22px] right-0 left-0 z-0 h-[1.5px] bg-slate-300/80 sm:top-[26px]" />

            <div className="no-scrollbar flex [scrollbar-width:none] items-start justify-start gap-3 overflow-x-auto px-4 pt-2 pb-4 [-ms-overflow-style:none] sm:gap-4 sm:px-8 md:px-12 lg:justify-between lg:gap-5 lg:px-14 xl:px-20 [&::-webkit-scrollbar]:hidden">
              {heroFeatureCards.map((card) => (
                <div
                  key={card.id}
                  className="group flex max-w-[200px] min-w-[130px] flex-1 shrink-0 cursor-default flex-col items-center select-none sm:min-w-[140px] md:min-w-[150px] lg:min-w-0 lg:shrink"
                >
                  {/* Hanging String from wire down to card */}
                  <div
                    className={`w-[1.5px] bg-slate-300/90 ${card.stringClass} transition-colors duration-300 group-hover:bg-blue-400`}
                  />

                  {/* Hanging Clip / Pin */}
                  <div className="relative z-10 -mb-1.5 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full border-2 border-white bg-slate-400 shadow-xs transition-colors group-hover:bg-blue-600" />
                  </div>

                  {/* Hanging Card Body */}
                  <div
                    className={`min-h-[102px] w-full rounded-2xl bg-gradient-to-b sm:min-h-[114px] ${card.bgGradient} transform border border-slate-200/90 p-3.5 shadow-md transition-all duration-300 hover:shadow-xl sm:p-4 ${card.hangingRotation} flex flex-col justify-center text-center group-hover:-translate-y-1 group-hover:scale-105 group-hover:rotate-0`}
                  >
                    <h4 className="text-sm leading-snug font-bold text-slate-900 sm:text-[15px] lg:text-base">
                      {isEs ? card.titleEs : card.titleEn}
                    </h4>
                    <p className="mt-1 text-xs leading-snug font-medium text-slate-500 sm:text-[13px]">
                      {isEs ? card.descEs : card.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05 — FOUNDER STORY: THE EMOTIONAL CORE */}
        <section
          id="founder"
          className="w-full border-t border-slate-200/80 bg-[#FCFDFD] px-6 py-20 sm:px-12 sm:py-28 md:px-[60px] lg:px-[120px]"
        >
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[450px_1fr] lg:gap-12">
              {/* Founder Image Column */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative flex h-full min-h-[480px] w-full max-w-[420px] flex-col justify-between sm:min-h-[540px] sm:max-w-[450px] lg:max-w-none">
                  <div className="relative h-full min-h-[460px] w-full sm:min-h-[520px]">
                    <Image
                      src={aboutImages.founder}
                      alt="Joni Gathers, MSN, APRN, FNP-C - Founder of NephroReach"
                      fill
                      className="object-cover object-top"
                      priority
                    />
                  </div>

                  {/* Overlaid Name & Designation Card on top of image */}
                  <div className="absolute right-2 bottom-0 left-2 z-10 rounded-2xl border border-slate-100/90 bg-white/95 p-3.5 text-left shadow-lg backdrop-blur-md sm:right-3 sm:bottom-0 sm:left-3 sm:p-4">
                    <h3 className="text-xl leading-tight font-bold text-slate-900 sm:text-[22px]">
                      Joni Gathers
                    </h3>
                    <p className="mt-0.5 text-sm font-semibold text-slate-500 sm:text-base">
                      MSN, APRN, FNP-C
                    </p>
                    <p className="mt-0.5 text-xs leading-tight font-medium text-slate-500 sm:text-sm">
                      {isEs
                        ? "Fundadora & FNP-C"
                        : "Founder & Certified Family Nurse Practitioner"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editorial Biography Column */}
              <div className="flex flex-col justify-between space-y-6 pt-1 lg:pt-0">
                <div>
                  <h2 className="relative mb-2 inline-block pb-2 text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    {isEs ? "Sobre la Fundadora" : "About the Founder"}
                    <svg
                      className="absolute -bottom-0.5 left-0 h-3 w-full text-[#E5A8A3]"
                      viewBox="0 0 100 10"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0 5 Q 50 10 100 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                      />
                    </svg>
                  </h2>
                </div>

                <div className="space-y-4 text-base leading-relaxed font-medium text-slate-600">
                  <p className="text-justify">
                    {isEs
                      ? "Hola, soy Joni Gathers, MSN, APRN, FNP-C, una enfermera especialista familiar certificada con una década de experiencia en nefrología y diálisis. A lo largo de mi carrera como enfermera de diálisis y proveedora médica, he atendido a cientos de pacientes que viven con enfermedad renal crónica (ERC), insuficiencia renal terminal (ESKD), hipertensión, diabetes y aquellos que reciben diálisis."
                      : "Hello, I’m Joni Gathers, MSN, APRN, FNP-C, a board-certified Family Nurse Practitioner with a decade of nephrology and dialysis experience. Throughout my career as both a Dialysis Nurse and Practitioner, I’ve cared for hundreds of patients living with chronic kidney disease (CKD), end-stage kidney disease (ESKD), hypertension, diabetes, and those receiving dialysis."}
                  </p>
                  <p className="text-justify">
                    {isEs
                      ? "Al trabajar en estrecha colaboración con los pacientes y sus familias, reconocí que muchas hospitalizaciones y visitas a la sala de emergencias ocurren porque los pacientes simplemente no tienen acceso a una educación renal comprensible y continua fuera de sus consultas clínicas. Muchos salen de sus citas abrumados, sin estar seguros de qué significan sus resultados de laboratorio, cómo controlar la ingesta de líquidos, qué síntomas requieren atención inmediata o cómo afrontar con confianza la vida con una enfermedad renal."
                      : "Working closely with patients and families, I recognized that many hospitalizations and emergency room visits happen because patients simply don’t have access to understandable, ongoing kidney education outside of their clinic visits. Many leave appointments overwhelmed, unsure of what their lab results mean, how to manage fluid intake, what symptoms require immediate attention, or how to confidently navigate life with kidney disease."}
                  </p>
                  <p className="pt-1 text-lg font-semibold text-slate-900">
                    {isEs
                      ? "Creé NephroReach para cerrar esa brecha."
                      : "I created NephroReach to bridge that gap."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 06 — WHAT MAKES US DIFFERENT */}
        <section className="w-full border-t border-slate-200/80 bg-[#F8FAFC] px-6 py-20 sm:px-12 sm:py-24 md:px-[60px] lg:px-[120px]">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="relative inline-block pb-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {isEs
                  ? "Lo Que Nos Hace Diferentes"
                  : "What Makes Us Different"}
                <svg
                  className="absolute -bottom-0.5 left-0 h-3 w-full text-[#E5A8A3]"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                </svg>
              </h2>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Video,
                  titleEn: "On-Demand Video Learning",
                  titleEs: "Biblioteca de Video Educativa",
                  descEn:
                    "On-demand educational videos covering CKD, dialysis, nutrition, medications, lab values, and kidney health.",
                  descEs:
                    "Videos educativos a pedido que cubren ERC, diálisis, nutrición, medicamentos, valores de laboratorio y salud renal.",
                },
                {
                  icon: GraduationCap,
                  titleEn: "Live Expert Sessions",
                  titleEs: "Sesiones en Vivo con Expertos",
                  descEn:
                    "Live educational sessions with experienced kidney care professionals.",
                  descEs:
                    "Sesiones educativas en vivo con profesionales experimentados en el cuidado de los riñones.",
                },
                {
                  icon: Activity,
                  titleEn: "Interactive Health Tracking",
                  titleEs: "Seguimiento Interactivo de Salud",
                  descEn:
                    "Interactive health tracking tools, including blood pressure, weight, medications, labs, dialysis treatments, and symptoms.",
                  descEs:
                    "Herramientas interactivas de seguimiento de la salud, que incluyen presión arterial, peso, medicamentos, laboratorios, tratamientos de diálisis y síntomas.",
                },
                {
                  icon: HeartHandshake,
                  titleEn: "Dedicated Caregiver Support",
                  titleEs: "Apoyo Dedicado para Cuidadores",
                  descEn: "Resources designed specifically for caregivers.",
                  descEs: "Recursos diseñados específicamente para cuidadores.",
                },
                {
                  icon: Stethoscope,
                  titleEn: "Dialysis & Treatment Preparation",
                  titleEs: "Preparación para Diálisis y Tratamientos",
                  descEn:
                    "Educational programs that help patients prepare for dialysis and better understand treatment options.",
                  descEs:
                    "Programas educativos que ayudan a los pacientes a prepararse para la diálisis y comprender mejor las opciones de tratamiento.",
                },
                {
                  icon: BellRing,
                  titleEn: "Symptom Awareness & Action Guidance",
                  titleEs: "Guía Práctica y Alertas de Síntomas",
                  descEn:
                    "Practical guidance to help patients recognize concerning symptoms, know when to contact their dialysis or nephrology team, and understand when emergency care may be necessary.",
                  descEs:
                    "Orientación práctica para ayudar a los pacientes a reconocer síntomas preocupantes, saber cuándo comunicarse con su equipo de diálisis o nefrología y comprender cuándo puede ser necesaria la atención de emergencia.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col items-start gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:p-7"
                >
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/80 bg-[#EAF0F8] text-blue-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-[#DFEAF5] group-hover:text-blue-700 sm:h-13 sm:w-13">
                    <item.icon className="h-6 w-6 stroke-[2.2]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg leading-snug font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 sm:text-xl">
                    {isEs ? item.titleEs : item.titleEn}
                  </h3>

                  {/* Body */}
                  <p className="text-sm leading-relaxed font-medium text-slate-600">
                    {isEs ? item.descEs : item.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 07 — MEET OUR EXPERTS: CREDIBLE & ACCESSIBLE */}
        <section
          id="experts"
          className="w-full border-t border-slate-200/80 bg-[#FCFDFD] px-6 py-20 sm:px-12 sm:py-28 md:px-[60px] lg:px-[120px]"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 max-w-3xl text-left">
              <h2 className="relative inline-block pb-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {isEs
                  ? "Conozca a Nuestro Panel de Expertos"
                  : "Meet Our Expert Panel"}
                <svg
                  className="absolute -bottom-0.5 left-0 h-3 w-full text-[#E5A8A3]"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                </svg>
              </h2>
              <p className="mt-4 text-sm leading-relaxed font-medium text-slate-600 sm:text-base">
                {isEs
                  ? "Nuestros miembros del panel aportan décadas de experiencia dedicada en trabajo social de nefrología, defensa de cuidadores y nutrición clínica renal."
                  : "Our panel members bring decades of dedicated experience in nephrology social work, caregiver advocacy, and clinical renal nutrition."}
              </p>
            </div>

            <div className="mx-auto max-w-5xl space-y-20 sm:space-y-24">
              {/* Expert 01: Matilta Coleman */}
              <div
                className={`grid grid-cols-1 gap-8 lg:grid-cols-[255px_1fr] lg:gap-10 ${
                  expandedMatilta
                    ? "items-start"
                    : "items-start lg:items-center"
                }`}
              >
                {/* Expert Image Column */}
                <div className="flex justify-center lg:justify-start">
                  <div className="relative w-full max-w-[260px] overflow-hidden rounded-[28px] border border-slate-200/90 bg-gradient-to-b from-[#FBF8F4] via-[#FDFBFA] to-[#EFF3FA] shadow-xl sm:max-w-[280px] sm:rounded-[32px]">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <Image
                        src={aboutImages.panelist}
                        alt="Matilta Coleman, LMSW · LPLC"
                        fill
                        className="object-cover object-top"
                      />
                    </div>

                    {/* Overlaid Name & Designation Card on top of image */}
                    <div className="absolute right-3 bottom-3 left-3 z-10 rounded-2xl border border-slate-100/90 bg-white/95 p-3.5 text-left shadow-lg backdrop-blur-md sm:right-3.5 sm:bottom-3.5 sm:left-3.5 sm:p-4">
                      <h3 className="text-lg leading-tight font-bold text-slate-900 sm:text-[19px]">
                        Matilta Coleman
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">
                        LMSW · LPLC
                      </p>
                      <p className="mt-0.5 text-xs leading-tight font-medium text-slate-500 sm:text-sm">
                        {isEs ? "Coach de Salud Renal" : "Kidney Health Coach"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Editorial Biography Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[26px] leading-tight font-extrabold tracking-tight text-slate-900 sm:text-[32px]">
                      {isEs ? "Coach de Salud Renal" : "Kidney Health Coach"}
                    </h3>
                  </div>

                  {/* Bio Paragraphs */}
                  <div className="space-y-4 text-base leading-relaxed font-medium text-slate-600">
                    <p className="text-justify">
                      {isEs
                        ? "He ejercido profesionalmente en el campo durante más de 3 décadas y he desarrollado mi carrera apoyando a personas, familias y comunidades mientras navegan por los desafíos de la atención médica y trabajan hacia un mayor bienestar. Con experiencia en atención compasiva, defensa, educación y coordinación de la atención, me comprometo a ayudar a las personas a comprender sus necesidades de salud y acceder al apoyo necesario para prosperar."
                        : "I have been practicing professionally in the field for over 3 decades and have built my career supporting individuals, families, and communities as they navigate healthcare challenges and work toward improved well-being. With experience in compassionate care, advocacy, education, and care coordination, I am committed to helping people understand their health needs and access the support they need to thrive."}
                    </p>

                    {!expandedMatilta ? (
                      <p className="text-justify">
                        {isEs
                          ? "Creo que el cambio significativo comienza con la educación, la autodefensa y los recursos confiables. Me apasiona promover la alfabetización en salud y capacitar a las personas para que tomen decisiones informadas"
                          : "I believe meaningful change begins with education, self-advocacy, and trusted resources. I am passionate about promoting health literacy and empowering individuals to make informed decisions"}
                        {"... "}
                        <button
                          type="button"
                          onClick={() => setExpandedMatilta(true)}
                          className="inline cursor-pointer font-bold text-blue-600 transition-colors hover:text-blue-800 focus:outline-none"
                        >
                          {isEs ? "Ver más" : "See more"}
                        </button>
                      </p>
                    ) : (
                      <div className="space-y-4 pt-1">
                        <p className="text-justify">
                          {isEs
                            ? "Creo que el cambio significativo comienza con la educación, la autodefensa y los recursos confiables. Me apasiona promover la alfabetización en salud y capacitar a las personas para que tomen decisiones informadas, especialmente cuando enfrentan condiciones médicas complejas y sistemas de salud difíciles. Apoyar a organizaciones que sirven a personas con enfermedad renal es especialmente importante para mí porque la educación y defensa del paciente pueden mejorar en gran medida la calidad de vida y los resultados de salud. A través de la colaboración, la empatía y un enfoque centrado en la persona, me esfuerzo por ayudar a los pacientes y familias a convertirse en socios informados en la atención y contribuir a comunidades más saludables y empoderadas."
                            : "I believe meaningful change begins with education, self-advocacy, and trusted resources. I am passionate about promoting health literacy and empowering individuals to make informed decisions, especially when facing complex medical conditions and healthcare systems. Supporting organizations that serve individuals living with kidney disease is especially important to me because patient education and advocacy can greatly improve quality of life and health outcomes. Through collaboration, empathy, and a person-centered approach, I strive to help patients and families become informed partners in care and contribute to healthier, more empowered communities."}
                        </p>

                        {/* Bullet Points Section */}
                        <div className="animate-in fade-in space-y-3 border-t border-slate-200/80 pt-4 duration-300">
                          <p className="text-base font-bold text-slate-900">
                            {isEs
                              ? "Durante las sesiones abordo temas como:"
                              : "During sessions I cater to my audience discussing topics such as"}
                          </p>
                          <ul className="space-y-2.5 text-sm font-medium text-slate-600">
                            {[
                              {
                                en: "Navigating familial changes with end stage renal disease",
                                es: "Manejo de cambios familiares ante la enfermedad renal terminal",
                              },
                              {
                                en: "Addressing and Resolving marital issues with a spouse that has end stage renal disease",
                                es: "Abordar y resolver problemas matrimoniales con un cónyuge que tiene enfermedad renal terminal",
                              },
                              {
                                en: "Self care for caregivers",
                                es: "Autocuidado para cuidadores",
                              },
                              {
                                en: "Family Connections: Normalizing household discussions about health, health literacy and healthy outcomes",
                                es: "Conexiones Familiares: Normalizar las conversaciones del hogar sobre salud, alfabetización médica y resultados saludables",
                              },
                              {
                                en: "Respite, Short-Term/Long-Term Care",
                                es: "Cuidados de relevo, a corto y largo plazo",
                              },
                              {
                                en: "Caregivers the one’s that are forgotten",
                                es: "Los cuidadores: aquellos que suelen ser olvidados",
                              },
                              {
                                en: "And more bonus topics!..",
                                es: "¡Y más temas adicionales!..",
                              },
                            ].map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                <span>{isEs ? item.es : item.en}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* See less button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedMatilta(false)}
                            className="group inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-blue-600 transition-colors hover:text-blue-800 focus:outline-none"
                          >
                            <span>{isEs ? "Ver menos" : "See less"}</span>
                            <ChevronDown className="h-4 w-4 rotate-180 transition-transform duration-300" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expert 02: Annette Weseman */}
              <div className="grid grid-cols-1 items-start gap-8 border-t border-slate-200/80 pt-20 lg:grid-cols-[255px_1fr] lg:items-center lg:gap-10">
                {/* Expert Image Column */}
                <div className="flex justify-center lg:justify-start">
                  <div className="relative w-full max-w-[260px] overflow-hidden rounded-[28px] border border-slate-200/90 bg-gradient-to-b from-[#FBF8F4] via-[#FDFBFA] to-[#EFF3FA] shadow-xl sm:max-w-[280px] sm:rounded-[32px]">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <Image
                        src={aboutImages.nutritionist}
                        alt="Annette Weseman, RD, LD - Renal Nutrition Expert"
                        fill
                        className="object-cover object-top"
                      />
                    </div>

                    {/* Overlaid Name & Designation Card on top of image */}
                    <div className="absolute right-3 bottom-3 left-3 z-10 rounded-2xl border border-slate-100/90 bg-white/95 p-3.5 text-left shadow-lg backdrop-blur-md sm:right-3.5 sm:bottom-3.5 sm:left-3.5 sm:p-4">
                      <h3 className="text-lg leading-tight font-bold text-slate-900 sm:text-[19px]">
                        Annette Weseman
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">
                        RD, LD
                      </p>
                      <p className="mt-0.5 text-xs leading-tight font-medium text-slate-500 sm:text-sm">
                        {isEs
                          ? "Nutricionista Renal Experta"
                          : "Renal Nutrition Expert"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Editorial Biography Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[26px] leading-tight font-extrabold tracking-tight text-slate-900 sm:text-[32px]">
                      {isEs
                        ? "Nutricionista Renal Experta"
                        : "Renal Nutrition Expert"}
                    </h3>
                  </div>

                  {/* Bio Paragraph */}
                  <div className="text-base leading-relaxed font-medium text-slate-600">
                    <p className="text-justify">
                      {isEs
                        ? "Annette Weseman es una dietista registrada y licenciada con 25 años de experiencia en nutrición clínica. Tiene amplia experiencia ayudando a personas a controlar la diabetes y se ha especializado en nutrición renal durante los últimos 12 años. A Annette le apasiona capacitar a los pacientes con enfermedad renal crónica para que tomen decisiones informadas sobre alimentos, medicamentos y opciones de estilo de vida saludable. Cuenta con licencia en Carolina del Sur y está registrada en la Comisión de Registro Dietético (CDR)."
                        : "Annette Weseman is a licensed registered dietitian with 25 years experience in clinical nutrition. She has extensive experience helping individuals manage diabetes and has specialized in renal nutrition for the past 12 years. Annette is passionate about empowering patients with chronic kidney disease to make informed decisions about food, medicine, and healthy lifestyle choices. She is licensed in South Carolina and registered with the Commission on Dietetic Registration (CDR)."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 10 — MEMBER STORIES: REAL SUPPORT, REAL EXPERIENCES */}
        <section className="w-full border-t border-slate-100 bg-white px-6 py-20 sm:px-12 sm:py-24 md:px-[60px] lg:px-[120px]">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="relative inline-block pb-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {isEs
                  ? "Lo Que Dicen Nuestros Miembros"
                  : "What Our Members Say"}
                <svg
                  className="absolute -bottom-0.5 left-0 h-3 w-full text-[#E5A8A3]"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                </svg>
              </h2>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  initials: "AR",
                  bgInitials: "bg-blue-100 text-blue-700",
                  quoteEn:
                    "“The lessons helped me understand what questions to bring to my dialysis team. I felt more organized and less overwhelmed after the first week.”",
                  quoteEs:
                    "“Las lecciones me ayudaron a entender qué preguntas llevar a mi equipo de diálisis. Me sentí más organizada y menos abrumada después de la primera semana.”",
                  name: "Angela R.",
                  roleEn: "Dialysis Member",
                  roleEs: "Miembro en diálisis",
                },
                {
                  initials: "MJ",
                  bgInitials: "bg-teal-100 text-teal-800",
                  quoteEn:
                    "“As a caregiver, having simple explanations and reminders made a real difference. It gave our family a calmer way to talk about kidney health.”",
                  quoteEs:
                    "“Como cuidador, tener explicaciones simples y recordatorios hizo una verdadera diferencia. Le dio a nuestra familia una forma más tranquila de hablar sobre la salud renal.”",
                  name: "Marcus J.",
                  roleEn: "Family Caregiver",
                  roleEs: "Cuidador familiar",
                },
                {
                  initials: "CL",
                  bgInitials: "bg-emerald-100 text-emerald-800",
                  quoteEn:
                    "“The tracking tools helped me notice patterns before my appointments. I could share clearer notes and make better use of my visit time.”",
                  quoteEs:
                    "“Las herramientas de seguimiento me ayudaron a notar patrones antes de mis citas. Pude compartir notas más claras y aprovechar mejor el tiempo de la visita.”",
                  name: "Cynthia L.",
                  roleEn: "CKD Learner",
                  roleEs: "Estudiante de ERC",
                },
              ].map((story, idx) => (
                <article
                  key={idx}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:p-7"
                >
                  {/* Quote Body - matches What Makes Us Different card body text */}
                  <p className="mb-6 text-sm leading-relaxed font-medium text-slate-600">
                    {isEs ? story.quoteEs : story.quoteEn}
                  </p>

                  {/* Member Footer */}
                  <div className="mt-auto flex items-center gap-3.5 border-t border-slate-100 pt-5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${story.bgInitials}`}
                    >
                      {story.initials}
                    </div>
                    <div>
                      {/* Name - matches What Makes Us Different card title text */}
                      <h4 className="text-lg leading-snug font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 sm:text-xl">
                        {story.name}
                      </h4>
                      {/* Role - matches What Makes Us Different card body text */}
                      <p className="mt-0.5 text-sm leading-relaxed font-medium text-slate-500">
                        {isEs ? story.roleEs : story.roleEn}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 11 — FINAL CTA: CALM, REASSURING, OPTIMISTIC */}
        <section className="w-full border-t border-slate-200/80 bg-gradient-to-b from-white via-blue-50/40 to-blue-50/80 px-6 py-20 text-center sm:px-12 sm:py-28 md:px-[60px] lg:px-[120px]">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {isEs
                ? "No tienes que recorrer este camino renal en soledad."
                : "You don’t have to navigate kidney disease alone."}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/registration"
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-base font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
              >
                <span>{isEs ? "Probar por 7 días" : "Try for 7 days"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/faq"
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-base font-bold text-slate-800 transition-colors hover:bg-slate-50"
              >
                <span>
                  {isEs ? "Preguntas Frecuentes" : "Questions & Answers"}
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
