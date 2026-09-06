"use client";

import React, { useState } from "react";
import {
  User,
  Apple,
  Users,
  HeartPulse,
  Plus,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export type CareTeamRole = "Provider" | "Dietitian" | "Social Worker" | "Nurse";
export type QuestionStatus = "Answered" | "Discussed" | "Submitted";

export interface CareTeamQuestion {
  id: string;
  role: CareTeamRole;
  question: string;
  dateAdded: string;
  status: QuestionStatus;
}

const INITIAL_QUESTIONS: CareTeamQuestion[] = [
  {
    id: "q1",
    role: "Provider",
    question: "Why was my dry weight changed?",
    dateAdded: "May 28, 2024",
    status: "Answered",
  },
  {
    id: "q2",
    role: "Provider",
    question: "Am I a transplant candidate?",
    dateAdded: "May 20, 2024",
    status: "Discussed",
  },
  {
    id: "q3",
    role: "Provider",
    question: "Can I switch to home dialysis?",
    dateAdded: "May 15, 2024",
    status: "Submitted",
  },
  {
    id: "q4",
    role: "Provider",
    question: "Why is my phosphorus high?",
    dateAdded: "May 10, 2024",
    status: "Answered",
  },
  {
    id: "q5",
    role: "Dietitian",
    question: "What are low-potassium fruits I can enjoy safely?",
    dateAdded: "May 26, 2024",
    status: "Answered",
  },
  {
    id: "q6",
    role: "Dietitian",
    question: "How much fluid am I allowed on non-dialysis days?",
    dateAdded: "May 19, 2024",
    status: "Discussed",
  },
  {
    id: "q7",
    role: "Social Worker",
    question: "How do I apply for clinic transportation assistance?",
    dateAdded: "May 27, 2024",
    status: "Answered",
  },
  {
    id: "q8",
    role: "Social Worker",
    question: "Are there support groups for newly started dialysis patients?",
    dateAdded: "May 18, 2024",
    status: "Discussed",
  },
  {
    id: "q9",
    role: "Nurse",
    question: "My fistula access site has a slight tingling sensation after treatment",
    dateAdded: "May 29, 2024",
    status: "Answered",
  },
  {
    id: "q10",
    role: "Nurse",
    question: "Is mild cramping normal after removing 2.5L?",
    dateAdded: "May 22, 2024",
    status: "Discussed",
  },
];

export default function TeamQuestionsPage() {
  const { language } = useLanguage();

  const [questions, setQuestions] = useState<CareTeamQuestion[]>(INITIAL_QUESTIONS);
  const [selectedRole, setSelectedRole] = useState<CareTeamRole | "All">("All");

  // Ask Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [formQuestionRole, setFormQuestionRole] = useState<CareTeamRole>("Provider");
  const [formQuestionText, setFormQuestionText] = useState("");
  const [formQuestionDate, setFormQuestionDate] = useState("May 31, 2024");
  const [formQuestionStatus, setFormQuestionStatus] = useState<QuestionStatus>("Submitted");
  const [formQuestionError, setFormQuestionError] = useState("");

  // Cycle question status on click (Answered -> Discussed -> Submitted -> Answered)
  const cycleStatus = (id: string) => {
    setQuestions((prev: CareTeamQuestion[]) =>
      prev.map((q: CareTeamQuestion) => {
        if (q.id === id) {
          const nextStatusMap: Record<QuestionStatus, QuestionStatus> = {
            Answered: "Discussed",
            Discussed: "Submitted",
            Submitted: "Answered",
          };
          return { ...q, status: nextStatusMap[q.status] || "Answered" };
        }
        return q;
      })
    );
  };

  const handleOpenAskModal = () => {
    setFormQuestionRole(selectedRole === "All" ? "Provider" : selectedRole);
    setFormQuestionText("");
    setFormQuestionDate("May 31, 2024");
    setFormQuestionStatus("Submitted");
    setFormQuestionError("");
    setIsQuestionModalOpen(true);
  };

  const handleAskQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestionText.trim()) {
      setFormQuestionError("Please enter your question.");
      return;
    }

    const newQuestion: CareTeamQuestion = {
      id: Date.now().toString(),
      role: formQuestionRole,
      question: formQuestionText.trim(),
      dateAdded: formQuestionDate.trim() || "Today",
      status: formQuestionStatus,
    };

    setQuestions([newQuestion, ...questions]);
    setIsQuestionModalOpen(false);
  };

  const careTeamTabs: { role: CareTeamRole | "All"; label: string; icon: any; iconColor: string }[] = [
    {
      role: "All",
      label: language === "ES" ? "Todas" : "All",
      icon: Users,
      iconColor: "text-blue-600",
    },
    {
      role: "Provider",
      label: language === "ES" ? "Proveedor" : "Provider",
      icon: User,
      iconColor: "text-blue-600",
    },
    {
      role: "Dietitian",
      label: language === "ES" ? "Dietista" : "Dietitian",
      icon: Apple,
      iconColor: "text-emerald-600",
    },
    {
      role: "Social Worker",
      label: language === "ES" ? "Trabajador Social" : "Social Worker",
      icon: Users,
      iconColor: "text-teal-600",
    },
    {
      role: "Nurse",
      label: language === "ES" ? "Enfermero/a" : "Nurse",
      icon: HeartPulse,
      iconColor: "text-amber-600",
    },
  ];

  const displayedQuestions =
    selectedRole === "All"
      ? questions
      : questions.filter((q) => q.role === selectedRole);

  return (
    <div className="w-full max-w-7xl mx-auto pb-8">
      {/* MAIN CARD: CARE TEAM QUESTIONS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Card Header with Title and Single "+ Ask a Question" Button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
            {language === "ES" ? "Preguntas al Equipo" : "Care Team Questions"}
          </h1>

          <button
            type="button"
            onClick={handleOpenAskModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{language === "ES" ? "Hacer Pregunta" : "Ask a Question"}</span>
          </button>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto border-b border-slate-200 no-scrollbar pb-px">
          {careTeamTabs.map((tab) => {
            const isActive = selectedRole === tab.role;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.role}
                type="button"
                onClick={() => setSelectedRole(tab.role)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive
                    ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <IconComponent className={`h-4 w-4 ${isActive ? "text-blue-600" : tab.iconColor}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Questions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3.5 px-4 sm:px-6">{language === "ES" ? "Pregunta" : "Question"}</th>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                  {language === "ES" ? "Fecha Agregada" : "Date Added"}
                </th>
                <th className="py-3.5 px-4 sm:px-6 text-center">
                  {language === "ES" ? "Estado (Clic para Cambiar)" : "Status (Click to Change)"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {displayedQuestions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                    {language === "ES"
                      ? "No hay preguntas registradas para esta categoría."
                      : "No questions recorded for this category yet."}
                  </td>
                </tr>
              ) : (
                displayedQuestions.map((q) => {
                  const statusStyles: Record<QuestionStatus, string> = {
                    Answered: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                    Discussed: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                    Submitted: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
                  };

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6 text-slate-900 font-semibold leading-snug">
                        {q.question}
                        {selectedRole === "All" && (
                          <span className="inline-block ml-2 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                            {q.role}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-500 whitespace-nowrap text-xs font-medium">
                        {q.dateAdded}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => cycleStatus(q.id)}
                          title="Click to toggle status (Answered → Discussed → Submitted)"
                          className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${statusStyles[q.status]}`}
                        >
                          {q.status}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ASK QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-left shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {language === "ES" ? "Hacer Pregunta al Equipo" : "Ask Care Team a Question"}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formQuestionError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                {formQuestionError}
              </div>
            )}

            <form onSubmit={handleAskQuestionSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Destinatario / Especialidad" : "Care Team Member"} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formQuestionRole}
                  onChange={(e) => setFormQuestionRole(e.target.value as CareTeamRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Provider">Provider</option>
                  <option value="Dietitian">Dietitian</option>
                  <option value="Social Worker">Social Worker</option>
                  <option value="Nurse">Nurse</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Tu Pregunta" : "Your Question"} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Why was my dry weight changed?"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Fecha" : "Date Added"}
                </label>
                <input
                  type="text"
                  value={formQuestionDate}
                  onChange={(e) => setFormQuestionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="May 31, 2024"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Estado Inicial" : "Initial Status"}
                </label>
                <select
                  value={formQuestionStatus}
                  onChange={(e) => setFormQuestionStatus(e.target.value as QuestionStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Discussed">Discussed</option>
                  <option value="Answered">Answered</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 text-sm transition-colors shadow-sm cursor-pointer"
                >
                  {language === "ES" ? "Enviar Pregunta" : "Submit Question"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 text-sm transition-colors cursor-pointer"
                >
                  {language === "ES" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
