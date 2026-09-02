"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Phone, MapPin, PlayCircle, FileText } from "lucide-react";

interface SymptomDetail {
  title: string;
  urgentNotice: string;
  emergencySymptoms: string[];
  importantIn: string[];
  videos: { title: string; duration: string }[];
  articles: { title: string; readTime: string }[];
}

const SYMPTOM_DATA: Record<string, SymptomDetail> = {
  "chest-pain": {
    title: "Chest Pain",
    urgentNotice: "Seek Emergency Care Immediately",
    emergencySymptoms: [
      "Chest pressure",
      "Chest tightness",
      "Crushing chest pain",
      "Pain spreading to arm, jaw, neck, or back",
      "Chest pain with sweating or nausea",
    ],
    importantIn: [
      "Dialysis patients",
      "Kidney failure patients",
      "Patients with diabetes or heart disease",
    ],
    videos: [{ title: "Managing Symptoms After Dialysis", duration: "8:30" }],
    articles: [{ title: "When to Contact Your Dialysis Clinic", readTime: "5 min read" }],
  },
};

const DEFAULT_SYMPTOM: SymptomDetail = {
  title: "Symptom Details",
  urgentNotice: "Seek Emergency Care Immediately",
  emergencySymptoms: [
    "Severe or sudden onset of symptoms",
    "Difficulty breathing or chest discomfort",
    "Unusual weakness or dizziness",
    "Rapidly worsening pain or swelling",
  ],
  importantIn: [
    "Dialysis patients",
    "Kidney failure patients",
    "Patients with high risk factors",
  ],
  videos: [{ title: "Managing Symptoms After Dialysis", duration: "8:30" }],
  articles: [{ title: "When to Contact Your Dialysis Clinic", readTime: "5 min read" }],
};

export default function SymptomDetailPage() {
  const params = useParams();
  const rawSlug = (params?.slug as string) || "chest-pain";
  const slug = rawSlug.toLowerCase().replace(/%20/g, "-");

  const formattedTitle = rawSlug
    .replace(/-/g, " ")
    .replace(/%20/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const data = SYMPTOM_DATA[slug] || {
    ...DEFAULT_SYMPTOM,
    title: formattedTitle,
  };

  return (
    <div className="w-full space-y-6">
      {/* TOP EMERGENCY WARNING ALERT CARD */}
      <section className="rounded-3xl border border-red-200 bg-[#FFF5F5] p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-red-950 font-bold text-lg">
          <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
          <span>{data.urgentNotice}</span>
        </div>

        <p className="text-xs font-medium text-slate-700 leading-relaxed">
          Before The ER™ is an educational support feature only and does not provide medical advice, diagnosis, emergency services, or clinical triage. Information provided is general education and may not apply to every individual or situation. Always use your judgment and contact emergency services if you believe you are experiencing a medical emergency.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="tel:911"
            className="flex items-center gap-2 rounded-xl bg-[#EF4444] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-600 transition-colors"
          >
            <Phone className="h-4 w-4" />
            CALL 911
          </a>

          <a
            href="https://www.google.com/maps/search/nearest+emergency+room"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <MapPin className="h-4 w-4 text-slate-600" />
            Find Nearest ER
          </a>
        </div>
      </section>

      {/* MAIN SYMPTOM DETAILS CARD */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-5">
          {/* Subsection 1 */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Call emergency services immediately for:
            </h2>
            <ul className="space-y-1.5 pl-6 text-xs font-medium text-slate-700 list-disc">
              {data.emergencySymptoms.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Subsection 2 */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Especially important in:
            </h2>
            <ul className="space-y-1.5 pl-6 text-xs font-medium text-slate-700 list-disc">
              {data.importantIn.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* RELATED EDUCATION CARD */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Related Education</h2>

        <div className="space-y-3">
          {/* Video Item */}
          {data.videos.map((vid, idx) => (
            <Link
              key={idx}
              href="/dashboard/education-center"
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
            >
              <div className="relative flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-900/10 border border-blue-200">
                <Image
                  src="/images/logo.svg"
                  alt="NephroReach"
                  width={48}
                  height={32}
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{vid.title}</h3>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                  <PlayCircle className="h-3.5 w-3.5 text-blue-600" />
                  Video • {vid.duration}
                </p>
              </div>
            </Link>
          ))}

          {/* Article Item */}
          {data.articles.map((art, idx) => (
            <Link
              key={idx}
              href="/dashboard/education-center"
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
            >
              <div className="relative flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-900/10 border border-blue-200">
                <Image
                  src="/images/logo.svg"
                  alt="NephroReach"
                  width={48}
                  height={32}
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{art.title}</h3>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Article • {art.readTime}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
