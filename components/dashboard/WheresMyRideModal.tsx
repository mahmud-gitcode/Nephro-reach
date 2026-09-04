"use client";

import React, { useState } from "react";
import { Phone, Pencil } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function WheresMyRideModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [driverName, setDriverName] = useState("Bobo boy");
  const [driverPhone, setDriverPhone] = useState("(684) 555-0102");
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  if (isEditing) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-3xl bg-white p-6 text-left shadow-2xl space-y-6 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Form Field 1: My Ride Name */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-slate-900">
              {t("myRides.driverNameLabel")}
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-base font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Bobo boy"
            />
          </div>

          {/* Form Field 2: Phone Number */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-slate-900">
              {t("myRides.phoneLabel")}
            </label>
            <input
              type="text"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-base font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="(684) 555-0102"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-6 py-3.5 text-base transition-colors shadow-sm cursor-pointer"
            >
              {t("myRides.saveRide")}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-3.5 text-base transition-colors cursor-pointer"
            >
              {t("myRides.cancel")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl space-y-5 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue Car Signal Icon Header */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50/90 text-[#2563EB]">
            <svg className="h-10 w-10 fill-current" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">{t("myRides.title")}</h2>
          <p className="text-sm font-medium text-slate-600">
            {t("myRides.subtitle")}
          </p>
        </div>

        {/* Card 1: My Ride */}
        <div className="rounded-2xl border border-blue-100 bg-[#F4F8FF] p-4 text-left space-y-3 relative">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">{t("myRides.sectionTitle")}</h3>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={t("myRides.editDetails")}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">{driverName}</p>
            <p className="text-sm font-medium text-slate-600">{driverPhone}</p>
          </div>

          <a
            href={`tel:${driverPhone.replace(/[^0-9+]/g, "")}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Phone className="h-4 w-4" />
            {t("myRides.call")} {driverName}
          </a>
        </div>

        {/* Card 2: Ride share Apps */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-left space-y-3">
          <h3 className="text-base font-bold text-slate-900">{t("myRides.rideshareTitle")}</h3>

          <a
            href="https://m.uber.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] py-3.5 text-sm font-bold text-white hover:bg-slate-900 transition-colors shadow-sm"
          >
            <Phone className="h-4 w-4" />
            {t("myRides.openUber")}
          </a>

          <a
            href="https://www.lyft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF2B99] py-3.5 text-sm font-bold text-white hover:bg-pink-600 transition-colors shadow-sm"
          >
            <Phone className="h-4 w-4" />
            {t("myRides.openLyft")}
          </a>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-[#F1F5F9] py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          {t("myRides.close")}
        </button>
      </div>
    </div>
  );
}
