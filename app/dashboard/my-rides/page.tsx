"use client";

import React, { useState, useEffect } from "react";
import { Phone, Pencil, Plus, Trash2, X, Car, Star, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface RideContact {
  id: string;
  name: string;
  phone: string;
  note?: string;
  isPrimary?: boolean;
}

const DEFAULT_RIDES: RideContact[] = [
  {
    id: "1",
    name: "Bobo boy",
    phone: "(684) 555-0102",
    isPrimary: true,
  },
];

export default function MyRidesPage() {
  const { t } = useLanguage();

  const [rides, setRides] = useState<RideContact[]>(DEFAULT_RIDES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formError, setFormError] = useState("");

  // Load saved rides from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nephroreach_my_rides");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((r: RideContact) => {
            if (r.isPrimary && r.note && /primary/i.test(r.note)) {
              return { ...r, note: undefined };
            }
            return r;
          });
          setRides(cleaned);
        }
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const saveRides = (newRides: RideContact[]) => {
    setRides(newRides);
    try {
      localStorage.setItem("nephroreach_my_rides", JSON.stringify(newRides));
    } catch {
      // ignore
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setFormName("");
    setFormPhone("");
    setFormNote("");
    setFormIsPrimary(rides.length === 0);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ride: RideContact) => {
    setModalMode("edit");
    setEditingId(ride.id);
    setFormName(ride.name);
    setFormPhone(ride.phone);
    setFormNote(ride.note || "");
    setFormIsPrimary(Boolean(ride.isPrimary));
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError(t("myRides.errorName"));
      return;
    }
    if (!formPhone.trim()) {
      setFormError(t("myRides.errorPhone"));
      return;
    }

    if (modalMode === "add") {
      const newRide: RideContact = {
        id: Date.now().toString(),
        name: formName.trim(),
        phone: formPhone.trim(),
        note: formNote.trim() || undefined,
        isPrimary: formIsPrimary || rides.length === 0,
      };

      let updated = [...rides];
      if (newRide.isPrimary) {
        updated = updated.map((r) => ({ ...r, isPrimary: false }));
      }
      updated.push(newRide);
      saveRides(updated);
    } else if (modalMode === "edit" && editingId) {
      let updated = rides.map((r) => {
        if (r.id === editingId) {
          return {
            ...r,
            name: formName.trim(),
            phone: formPhone.trim(),
            note: formNote.trim() || undefined,
            isPrimary: formIsPrimary,
          };
        }
        return formIsPrimary ? { ...r, isPrimary: false } : r;
      });
      saveRides(updated);
    }

    handleCloseModal();
  };

  const handleDeleteRide = (id: string, name: string) => {
    const confirmMsg = t("myRides.confirmDelete").replace("{name}", name);
    if (confirm(confirmMsg)) {
      const remaining = rides.filter((r) => r.id !== id);
      if (remaining.length > 0 && !remaining.some((r) => r.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      saveRides(remaining);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
            <Car className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {t("myRides.sectionTitle") || "Where's My Ride"}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>{t("myRides.addRide")}</span>
        </button>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SECTION 1: Saved Drivers & Personal Transport */}
        <section className="lg:col-span-7 xl:col-span-7 space-y-4">

          {rides.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Car className="h-7 w-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-base font-bold text-slate-800">{t("myRides.noRides")}</p>
                <p className="text-xs text-slate-500">
                  Save phone numbers for your primary driver, family member, or medical transit service for fast, one-tap calling.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{t("myRides.addFirstRide")}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rides.map((ride) => (
                <div
                  key={ride.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                    ride.isPrimary
                      ? "border-blue-300 bg-gradient-to-b from-blue-50/60 to-white shadow-sm ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {/* Card Top: Driver Info & Action buttons */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-base ${
                            ride.isPrimary
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ride.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {ride.name}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {ride.isPrimary && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                <Star className="h-2.5 w-2.5 fill-blue-700 text-blue-700" />
                                {t("myRides.primaryBadge")}
                              </span>
                            )}
                            {ride.note && (!ride.isPrimary || !/primary/i.test(ride.note)) && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {ride.note}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ride)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title={t("myRides.editDetails")}
                          aria-label={`Edit ${ride.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {rides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRide(ride.id, ride.name)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title={t("myRides.removeRide")}
                            aria-label={`Remove ${ride.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {t("myRides.phoneLabel") || "Phone Number"}
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {ride.phone}
                      </p>
                    </div>
                  </div>

                  {/* Call CTA button */}
                  <a
                    href={`tel:${ride.phone.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-2.5 px-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.99]"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{t("myRides.call")} {ride.name}</span>
                  </a>
                </div>
              ))}
            </div>
          )}

        </section>

        {/* SECTION 2: SEPARATE RIDESHARE APPS SECTION */}
        <section className="lg:col-span-5 xl:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            {/* Section Header */}
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {t("myRides.rideshareTitle")}
              </h2>
            </div>

            {/* Rideshare Cards */}
            <div className="space-y-3.5">
              {/* Uber Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 hover:border-slate-300 transition-all space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white font-black text-sm">
                    U
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Uber</h3>
                </div>

                <a
                  href="https://m.uber.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-black py-3 px-4 text-sm font-bold text-white transition-all shadow-xs hover:shadow-sm"
                >
                  <Car className="h-4 w-4 shrink-0" />
                  <span>{t("myRides.openUber")}</span>
                </a>
              </div>

              {/* Lyft Card */}
              <div className="rounded-2xl border border-pink-100 bg-pink-50/30 p-4 hover:border-pink-200 transition-all space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF00BF] text-white font-black text-xs">
                    lyft
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Lyft</h3>
                </div>

                <a
                  href="https://www.lyft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF00BF] hover:bg-[#E000A8] py-3 px-4 text-sm font-bold text-white transition-all shadow-xs hover:shadow-sm"
                >
                  <Car className="h-4 w-4 shrink-0" />
                  <span>{t("myRides.openLyft")}</span>
                </a>
              </div>
            </div>

            {/* Third-Party Transportation Disclaimer */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldAlert className="h-4 w-4 text-slate-600 shrink-0" />
                <span>{t("myRides.disclaimerTitle") || "Third-Party Transportation Disclaimer:"}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                {t("myRides.disclaimerText") ||
                  "NephroReach does not provide, arrange, operate, endorse, or guarantee transportation services offered by third-party providers. Transportation availability, eligibility, pricing, scheduling, safety, and services are determined solely by the transportation provider. By selecting a transportation link, you will leave NephroReach and be subject to the third party's terms and privacy practices."}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ADD / EDIT RIDE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-left shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === "add" ? t("myRides.addNewRideModal") : t("myRides.editRideModal")}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title={t("myRides.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-900">
                  {t("myRides.driverNameLabel")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={t("myRides.driverNamePlaceholder")}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-900">
                  {t("myRides.phoneLabel")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={t("myRides.phonePlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-900">
                  {t("myRides.relationshipLabel")}
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={t("myRides.relationshipPlaceholder")}
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsPrimary}
                  onChange={(e) => setFormIsPrimary(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-700">
                  {t("myRides.setPrimary")}
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 text-sm transition-colors shadow-sm cursor-pointer"
                >
                  {modalMode === "add" ? t("myRides.saveRide") : t("myRides.updateInfo")}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 text-sm transition-colors cursor-pointer"
                >
                  {t("myRides.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
