"use client";

import React, { useState, useEffect } from "react";
import { Phone, Pencil, Plus, Trash2, X } from "lucide-react";
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
    <div className="w-full space-y-6">
      {/* Main Centered Container */}
      <div className="flex justify-center py-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 text-center shadow-xl border border-slate-200 space-y-6">
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
            <h1 className="text-2xl font-bold text-slate-900">{t("myRides.title")}</h1>
            <p className="text-sm font-medium text-slate-600">
              {t("myRides.subtitle")}
            </p>
          </div>

          {/* Section: My Rides Header with "+ Add Ride" Button */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="text-left">
                <h2 className="text-base font-bold text-slate-900">{t("myRides.sectionTitle")}</h2>
                <p className="text-xs font-medium text-slate-500">
                  {rides.length}{" "}
                  {rides.length === 1
                    ? t("myRides.savedDriverSingle")
                    : t("myRides.savedDriverPlural")}
                </p>
              </div>

              {/* Explicit Add Button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-all shadow-xs hover:shadow-sm cursor-pointer active:scale-98"
                title={t("myRides.addRide")}
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>{t("myRides.addRide")}</span>
              </button>
            </div>

            {/* List of Rides */}
            {rides.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center space-y-3">
                <p className="text-sm text-slate-500">{t("myRides.noRides")}</p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t("myRides.addFirstRide")}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rides.map((ride) => (
                  <div
                    key={ride.id}
                    className={`rounded-2xl border text-left p-4 space-y-3 transition-all ${
                      ride.isPrimary
                        ? "border-blue-200 bg-[#F4F8FF] shadow-2xs"
                        : "border-slate-200 bg-white shadow-2xs hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-bold text-slate-900 truncate">
                            {ride.name}
                          </p>
                          {ride.isPrimary && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5">
                              {t("myRides.primaryBadge")}
                            </span>
                          )}
                          {ride.note && (!ride.isPrimary || !/primary/i.test(ride.note)) && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5">
                              {ride.note}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-600 mt-0.5">
                          {ride.phone}
                        </p>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ride)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                          title={t("myRides.editDetails")}
                          aria-label={`Edit ${ride.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {rides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRide(ride.id, ride.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title={t("myRides.removeRide")}
                            aria-label={`Remove ${ride.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Direct Call Button */}
                    <a
                      href={`tel:${ride.phone.replace(/[^0-9+]/g, "")}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-3 text-sm font-bold text-white transition-colors shadow-xs active:scale-[0.99]"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{t("myRides.call")} {ride.name}</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Ride share Apps */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-left space-y-3">
            <h2 className="text-base font-bold text-slate-900">{t("myRides.rideshareTitle")}</h2>

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
        </div>
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
