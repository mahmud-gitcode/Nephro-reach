"use client";

import React from "react";
import DialysisDaySymptomLogForm, {
  DialysisDayLogData,
} from "@/components/dashboard/DialysisDaySymptomLogForm";

export default function AddDialysisEntryModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: DialysisDayLogData) => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 md:p-6 backdrop-blur-xs transition-opacity overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DialysisDaySymptomLogForm
          isModal={true}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
