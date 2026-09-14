"use client";

import React, { useState, useEffect } from "react";
import { Plus, PenLine, Search, Trash2, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, Button, Input, Modal, Select, Textarea } from "@/components/ui";

export type CareTeamRole = "Provider" | "Dietitian" | "Social Worker" | "Nurse";
export type QuestionStatus = "Answered" | "Discussed" | "Submitted";

export interface CareTeamQuestion {
  id: string;
  role: CareTeamRole;
  question: string;
  status: QuestionStatus;
  answer?: string;
}

const INITIAL_QUESTIONS: CareTeamQuestion[] = [
  {
    id: "q1",
    role: "Provider",
    question: "Why was my dry weight changed?",
    status: "Answered",
    answer:
      "Dr. Miller explained that your blood pressure was dropping below 95/60 towards the end of treatments with mild leg cramping. Target dry weight was raised by 0.5 kg to 72.5 kg to evaluate comfort and avoid excessive fluid removal.",
  },
  {
    id: "q2",
    role: "Provider",
    question: "Am I a transplant candidate?",
    status: "Discussed",
    answer:
      "Reviewed initial health criteria with Dr. Miller. Cardiac clearance test referral and evaluation package submitted to the regional transplant center. Awaiting intake interview scheduling.",
  },
  {
    id: "q3",
    role: "Provider",
    question: "Can I switch to home dialysis?",
    status: "Submitted",
    answer: "",
  },
  {
    id: "q4",
    role: "Provider",
    question: "Why is my phosphorus high?",
    status: "Answered",
    answer:
      "Advised taking prescribed phosphate binders with every meal and snack, not after. Recommended avoiding dark sodas and packaged processed meats which contain hidden inorganic phosphate additives.",
  },
  {
    id: "q5",
    role: "Dietitian",
    question: "What are low-potassium fruits I can enjoy safely?",
    status: "Answered",
    answer:
      "Dietitian recommended apples, berries (strawberries, blueberries), grapes, and pineapple as excellent low-potassium choices. Limit high-potassium fruits like bananas, oranges, and melons.",
  },
  {
    id: "q6",
    role: "Dietitian",
    question: "How much fluid am I allowed on non-dialysis days?",
    status: "Discussed",
    answer:
      "Daily fluid target is 32 oz (about 1 liter) on non-dialysis days to keep interdialytic weight gains under 2.0 kg. Suggested using ice chips or freezing grapes to help control thirst.",
  },
  {
    id: "q7",
    role: "Dietitian",
    question: "What protein-rich snacks can I safely eat between dialysis days?",
    status: "Answered",
    answer:
      "Egg whites, Greek yogurt (monitored for potassium), renal-friendly protein bars, and roasted unsalted chicken strips are great low-phosphorus high-protein options.",
  },
  {
    id: "q8",
    role: "Social Worker",
    question: "How do I apply for clinic transportation assistance?",
    status: "Answered",
    answer:
      "Social worker completed the regional non-emergency medical transportation application. Door-to-door clinic shuttle ride service is confirmed to begin next Monday.",
  },
  {
    id: "q9",
    role: "Social Worker",
    question: "Are there support groups for newly started dialysis patients?",
    status: "Discussed",
    answer:
      "Connected with our clinic's monthly peer support group (every 2nd Tuesday at 5:00 PM) and provided the National Kidney Foundation peer mentoring program materials.",
  },
  {
    id: "q10",
    role: "Social Worker",
    question: "Can the clinic social worker help with prescription co-pay assistance?",
    status: "Answered",
    answer:
      "Social worker enrolled you in the non-profit medication foundation co-pay relief program, covering up to 90% of binder and calcitriol costs.",
  },
  {
    id: "q11",
    role: "Nurse",
    question: "My fistula access site has a slight tingling sensation after treatment",
    status: "Answered",
    answer:
      "Nurse assessed thrill and bruit; blood flow is strong and clear. Tingling was determined to be transient nerve sensitivity from arm positioning during the run. Advised warm compress and to report any throbbing.",
  },
  {
    id: "q12",
    role: "Nurse",
    question: "Is mild cramping normal after removing 2.5L?",
    status: "Discussed",
    answer:
      "Rapid fluid shifts towards the end of a session can trigger muscle cramps. Team adjusted the machine ultrafiltration profile and sodium ramp. Advised alerting the tech immediately if cramping starts.",
  },
];

const LOCAL_STORAGE_KEY = "nephroreach_care_team_questions_v7";

interface CareTeamQuestionsSectionProps {
  hideTitle?: boolean;
}

export default function CareTeamQuestionsSection({
  hideTitle = false,
}: CareTeamQuestionsSectionProps = {}) {
  const { language } = useLanguage();

  const [questions, setQuestions] = useState<CareTeamQuestion[]>(INITIAL_QUESTIONS);
  const [selectedRole, setSelectedRole] = useState<CareTeamRole | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | QuestionStatus>("All");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRole, setFormRole] = useState<CareTeamRole>("Provider");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formStatus, setFormStatus] = useState<QuestionStatus>("Submitted");
  const [formError, setFormError] = useState("");

  // Load questions from localStorage on mount & listen for custom updates
  useEffect(() => {
    const loadStored = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestions(parsed);
          }
        }
      } catch {
        // fallback
      }
    };

    loadStored();
    window.addEventListener("care_team_questions_updated", loadStored);
    return () => {
      window.removeEventListener("care_team_questions_updated", loadStored);
    };
  }, []);

  const saveQuestions = (updated: CareTeamQuestion[]) => {
    setQuestions(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
  };

  // Cycle status: Submitted -> Discussed -> Answered -> Submitted
  const cycleStatus = (id: string) => {
    const updated = questions.map((q) => {
      if (q.id === id) {
        const nextStatusMap: Record<QuestionStatus, QuestionStatus> = {
          Submitted: "Discussed",
          Discussed: "Answered",
          Answered: "Submitted",
        };
        return { ...q, status: nextStatusMap[q.status] || "Answered" };
      }
      return q;
    });
    saveQuestions(updated);
  };

  // Open modal to Add Question
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormRole(selectedRole === "All" ? "Provider" : selectedRole);
    setFormQuestion("");
    setFormAnswer("");
    setFormStatus("Submitted");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal to Edit Question / Answer
  const handleOpenEditModal = (q: CareTeamQuestion) => {
    setEditingId(q.id);
    setFormRole(q.role || "Provider");
    setFormQuestion(q.question);
    setFormAnswer(q.answer || "");
    setFormStatus(q.status);
    setFormError("");
    setIsModalOpen(true);
  };

  // Save Add or Edit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim()) {
      setFormError(
        language === "ES" ? "Por favor escribe la pregunta." : "Please enter the question."
      );
      return;
    }

    if (editingId) {
      // Edit existing
      const updated = questions.map((q) => {
        if (q.id === editingId) {
          return {
            ...q,
            role: formRole,
            question: formQuestion.trim(),
            answer: formAnswer.trim(),
            status: formStatus,
          };
        }
        return q;
      });
      saveQuestions(updated);
    } else {
      // Add new
      const hasAnswer = Boolean(formAnswer.trim());
      const newQuestion: CareTeamQuestion = {
        id: Date.now().toString(),
        role: formRole,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        status: hasAnswer && formStatus === "Submitted" ? "Answered" : formStatus,
      };
      saveQuestions([newQuestion, ...questions]);
    }

    setIsModalOpen(false);
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    const confirmMsg =
      language === "ES"
        ? "¿Seguro que deseas eliminar esta pregunta?"
        : "Are you sure you want to delete this question?";
    if (window.confirm(confirmMsg)) {
      const updated = questions.filter((q) => q.id !== id);
      saveQuestions(updated);
    }
  };

  // Segmented Options for Role Filter Dropdown: All, Provider, Dietitian, Social Worker, Nurse
  const roleTabs: {
    id: CareTeamRole | "All";
    label: string;
  }[] = [
    {
      id: "All",
      label: language === "ES" ? "Todos los Roles" : "All Roles",
    },
    {
      id: "Provider",
      label: language === "ES" ? "Proveedor" : "Provider",
    },
    {
      id: "Dietitian",
      label: language === "ES" ? "Dietista" : "Dietitian",
    },
    {
      id: "Social Worker",
      label: language === "ES" ? "Trabajador Social" : "Social Worker",
    },
    {
      id: "Nurse",
      label: language === "ES" ? "Enfermero/a" : "Nurse",
    },
  ];

  // Filter questions by Role, Status, and Search Query
  const filteredQuestions = questions.filter((q) => {
    const matchesRole = selectedRole === "All" || q.role === selectedRole;
    const matchesStatus = statusFilter === "All" || q.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      q.question.toLowerCase().includes(query) ||
      (q.answer && q.answer.toLowerCase().includes(query));

    return matchesRole && matchesStatus && matchesQuery;
  });

  const getStatusBadgeStyle = (status: QuestionStatus) => {
    switch (status) {
      case "Answered":
        return "bg-success-surface text-success border-success-line hover:bg-success-100";
      case "Discussed":
        return "bg-primary-soft text-fg-brand border-primary-soft-line hover:bg-brand-100";
      case "Submitted":
        return "bg-danger-surface text-danger border-danger-line hover:bg-danger-100";
      default:
        return "bg-surface-sunken text-fg-secondary border-line";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Optional Section Title (if !hideTitle) */}
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-fg tracking-tight uppercase">
            {language === "ES" ? "Preguntas al Equipo" : "Care Team Questions"}
          </h2>
        </div>
      )}

      {/* SINGLE UNIFIED ROW: Search (Small & First), Role Dropdown, Status Dropdown, and Add Question Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left cluster: Search Input (Small) followed by the 2 Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* 1. Search Bar (Small, placed before dropdowns) */}
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
            <label htmlFor="care-team-search" className="sr-only">
              {language === "ES" ? "Buscar preguntas" : "Search questions"}
            </label>
            <Input
              id="care-team-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "ES"
                  ? "Buscar preguntas..."
                  : "Search questions..."
              }
              className="pl-8"
            />
          </div>

          {/* 2. Role Filter Dropdown */}
          <div className="min-w-[140px] sm:min-w-[160px]">
            <label htmlFor="care-team-role" className="sr-only">
              {language === "ES" ? "Filtrar por rol" : "Filter by role"}
            </label>
            <Select
              id="care-team-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as CareTeamRole | "All")}
            >
              {roleTabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Status Filter Dropdown (All, Answered, Discussed, Submitted) */}
          <div className="min-w-[130px] sm:min-w-[150px]">
            <label htmlFor="care-team-status" className="sr-only">
              {language === "ES" ? "Filtrar por estado" : "Filter by status"}
            </label>
            <Select
              id="care-team-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "All" | QuestionStatus)}
            >
              <option value="All">
                {language === "ES" ? "Todos los Estados" : "All Status"}
              </option>
              <option value="Answered">
                {language === "ES" ? "Respondidas" : "Answered"}
              </option>
              <option value="Discussed">
                {language === "ES" ? "Discutidas" : "Discussed"}
              </option>
              <option value="Submitted">
                {language === "ES" ? "Pendientes" : "Submitted"}
              </option>
            </Select>
          </div>
        </div>

        {/* 4. Add Question Button (Right aligned) */}
        <Button onClick={handleOpenAddModal} className="ml-auto shrink-0">
          <Plus aria-hidden="true" />
          <span>{language === "ES" ? "Hacer Pregunta" : "Add Question"}</span>
        </Button>
      </div>

      {/* Clean Q & Ans Card List */}
      <div className="space-y-3.5">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-card border border-line bg-surface p-12 text-center text-fg-subtle space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-fg-subtle" />
            <p className="text-sm font-semibold text-fg-muted">
              {language === "ES"
                ? "No se encontraron preguntas para este miembro o filtro."
                : "No questions found for this care team member or filter."}
            </p>
            <p className="text-xs text-fg-subtle">
              {language === "ES"
                ? "Haz clic en 'Hacer Pregunta' para agregar una nueva duda o consulta."
                : "Click 'Ask a Question' to add a question for your care team."}
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="rounded-card border border-line bg-surface p-5 sm:p-6 shadow-control hover:shadow-control transition-shadow space-y-3"
            >
              {/* Question Row with Status Tag, Edit Button, and Delete */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-fg leading-snug">
                    {q.question}
                  </h3>
                </div>

                {/* Status Tag, Edit Button & Delete */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {/* Status Tag */}
                  <button
                    type="button"
                    onClick={() => cycleStatus(q.id)}
                    title={
                      language === "ES"
                        ? "Clic para cambiar estado (Pendiente → Discutida → Respondida)"
                        : "Click to cycle status (Submitted → Discussed → Answered)"
                    }
                    className={`px-3 py-1 rounded-pill text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 shadow-control ${getStatusBadgeStyle(
                      q.status
                    )}`}
                  >
                    {q.status === "Answered"
                      ? language === "ES"
                        ? "Respondida"
                        : "Answered"
                      : q.status === "Discussed"
                      ? language === "ES"
                        ? "Discutida"
                        : "Discussed"
                      : language === "ES"
                      ? "Pendiente"
                      : "Submitted"}
                  </button>

                  {/* Edit Button beside Status Tag */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border border-line bg-surface hover:bg-primary-soft hover:border-primary-soft-line text-fg-secondary hover:text-fg-brand text-xs font-semibold shadow-control transition-all cursor-pointer active:scale-95"
                    title={
                      language === "ES"
                        ? "Editar pregunta y respuesta"
                        : "Edit question and answer"
                    }
                  >
                    <PenLine className="h-3.5 w-3.5 text-fg-muted" />
                    <span>{language === "ES" ? "Editar" : "Edit"}</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 rounded-control text-fg-subtle hover:text-danger hover:bg-danger-surface transition-colors cursor-pointer"
                    title={language === "ES" ? "Eliminar" : "Delete"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Answer Row */}
              <div className="pt-3 border-t border-line-subtle flex items-start gap-2.5">
                <span className="text-sm font-bold text-fg-secondary shrink-0 select-none">
                  Ans:
                </span>
                {q.answer && q.answer.trim().length > 0 ? (
                  <p className="text-sm text-fg-muted leading-relaxed font-normal flex-1">
                    {q.answer}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-fg-subtle italic">
                    <span>
                      {language === "ES"
                        ? "Aún no se ha documentado una respuesta."
                        : "No answer documented yet."}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(q)}
                      className="text-fg-brand font-semibold not-italic hover:underline cursor-pointer"
                    >
                      {language === "ES" ? "+ Agregar Respuesta" : "+ Add Answer"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="wide"
        title={
          editingId
            ? language === "ES"
              ? "Editar Pregunta y Respuesta"
              : "Edit Question & Answer"
            : language === "ES"
              ? "Hacer Pregunta al Equipo"
              : "Ask Care Team a Question"
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsModalOpen(false)}
            >
              {language === "ES" ? "Cancelar" : "Cancel"}
            </Button>
            <Button type="submit" form="care-team-question-form">
              {editingId
                ? language === "ES"
                  ? "Guardar Cambios"
                  : "Save Changes"
                : language === "ES"
                  ? "Guardar Pregunta"
                  : "Save Question"}
            </Button>
          </>
        }
      >
            {formError && (
              <Alert tone="danger" className="mb-stack-lg">
                {formError}
              </Alert>
            )}

            <form
              id="care-team-question-form"
              onSubmit={handleFormSubmit}
              className="space-y-stack-lg"
            >
              <div className="space-y-1.5">
                <label className="text-overline mb-stack-xs block text-fg-muted">
                  {language === "ES" ? "Destinatario / Especialidad" : "Care Team Member"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <Select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as CareTeamRole)}
                >
                  <option value="Provider">
                    {language === "ES" ? "Proveedor (Provider)" : "Provider"}
                  </option>
                  <option value="Dietitian">
                    {language === "ES" ? "Dietista (Dietitian)" : "Dietitian"}
                  </option>
                  <option value="Social Worker">
                    {language === "ES" ? "Trabajador Social (Social Worker)" : "Social Worker"}
                  </option>
                  <option value="Nurse">
                    {language === "ES" ? "Enfermero/a (Nurse)" : "Nurse"}
                  </option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-overline mb-stack-xs block text-fg-muted">
                  {language === "ES" ? "Pregunta" : "Question"} <span className="text-danger">*</span>
                </label>
                <Textarea
                  rows={3}
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder={
                    language === "ES"
                      ? "p.ej. ¿Por qué cambiaron mi peso seco?"
                      : "e.g. Why was my dry weight changed?"
                  }
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-overline mb-stack-xs block text-fg-muted">
                  {language === "ES" ? "Respuesta (Ans)" : "Answer (Ans)"}
                </label>
                <Textarea
                  rows={4}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder={
                    language === "ES"
                      ? "Documenta la respuesta o indicaciones que te dio el equipo médico..."
                      : "Document what the care team member answered or instructed..."
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-overline mb-stack-xs block text-fg-muted">
                  {language === "ES" ? "Estado" : "Status"}
                </label>
                <Select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as QuestionStatus)}
                  className="w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-fg-secondary outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring"
                >
                  <option value="Answered">
                    {language === "ES" ? "Respondida (Answered)" : "Answered"}
                  </option>
                  <option value="Discussed">
                    {language === "ES" ? "Discutida (Discussed)" : "Discussed"}
                  </option>
                  <option value="Submitted">
                    {language === "ES" ? "Pendiente (Submitted)" : "Submitted"}
                  </option>
                </Select>
              </div>

            </form>
      </Modal>
    </div>
  );
}
