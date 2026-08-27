"use client";

import React, { useEffect } from "react";

const SYMPTOMS = [
  "Chest pain or pressure",
  "Trouble breathing",
  "Severe weakness or dizziness",
  "Bleeding that won't stop",
  "Fainting or passing out",
  "Severe swelling or sudden weight gain",
  "Confusion or inability to stay awake",
];

function ModalIcon({ src }: { src: string }) {
  return (
    <span className="relative block size-6 shrink-0 overflow-clip">
      <img src={src} alt="" className="size-full" />
    </span>
  );
}

type EmergencyModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function EmergencyModal({ open, onClose }: EmergencyModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close emergency dialog overlay"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-modal-title"
        className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[432px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="shrink-0 space-y-4 px-5 pt-5 sm:space-y-5 sm:px-6 sm:pt-6">
          <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
            <span className="relative block size-12 shrink-0 overflow-clip sm:size-16">
              <img
                src="/images/emergency/warning.svg"
                alt=""
                className="size-full"
              />
            </span>
            <h2
              id="emergency-modal-title"
              className="text-xl font-medium leading-7 tracking-[0.12px] text-[#0F172A] sm:text-2xl sm:leading-8"
            >
              This may be a medical emergency.
            </h2>
            <p className="text-sm font-medium leading-5 tracking-[0.08px] text-[#344056] sm:text-base sm:leading-6">
              NephroReach does NOT provide emergency care.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:gap-3">
            <a
              href="tel:911"
              className="relative flex h-12 w-full items-center justify-center gap-2 rounded bg-[#EF4444] px-3.5 text-base font-bold tracking-[0.08px] text-white transition-colors hover:bg-[#DC2626]"
            >
              <ModalIcon src="/images/emergency/call-white.svg" />
              CALL 911
            </a>

            <a
              href="https://www.google.com/maps/search/emergency+room+near+me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded border border-[#E2E8F0] bg-[#F1F5FA] px-3.5 text-sm font-bold tracking-[0.08px] text-[#0F172A] transition-colors hover:bg-[#E8EEF6] sm:h-12 sm:text-base"
            >
              <ModalIcon src="/images/emergency/location.svg" />
              Find Nearest Emergency Room
            </a>

            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded border border-[#E2E8F0] bg-[#F1F5FA] px-3.5 text-sm font-bold tracking-[0.08px] text-[#0F172A] transition-colors hover:bg-[#E8EEF6] sm:h-12 sm:text-base"
            >
              <ModalIcon src="/images/emergency/call.svg" />
              Emergency contact
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          <div className="flex w-full flex-col gap-3 rounded-[14px] border border-[#FFC9C9] bg-[#FEF2F2] p-4 sm:gap-3.5 sm:p-[17px]">
            <h3 className="text-base font-medium leading-6 tracking-[0.09px] text-[#0F172A] sm:text-lg sm:leading-7">
              When to Seek Emergency Care
            </h3>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              {SYMPTOMS.map((item) => (
                <li
                  key={item}
                  className="text-sm font-medium leading-5 tracking-[0.07px] text-[#344056]"
                >
                  • {item}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium leading-5 tracking-[0.07px] text-[#0F172A]">
              If you feel something is seriously wrong, do not wait. Call 911 or
              go to the nearest emergency room immediately.
            </p>
          </div>

          <p className="mt-4 text-center text-sm font-medium leading-5 tracking-[0.07px] text-[#6A7282]">
            NephroReach is an education and support platform only. We do not
            provide medical advice, diagnosis, or emergency services.
          </p>
        </div>

        <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-5 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center gap-2 rounded border border-[#E2E8F0] bg-[#F1F5FA] px-3.5 text-base font-bold tracking-[0.08px] text-[#0F172A] transition-colors hover:bg-[#E8EEF6] sm:h-12"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
