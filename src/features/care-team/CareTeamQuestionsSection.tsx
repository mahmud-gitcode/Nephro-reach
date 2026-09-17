"use client";

import React, { useState } from "react";
import { Plus, PenLine, Search, Trash2, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  AsyncSection,
  Button,
  Card,
  Input,
  Modal,
  SectionTitle,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import {
  statusForNew,
  useCareTeamQuestions,
  type CareTeamQuestion,
  type CareTeamRole,
  type QuestionStatus,
} from "@/features/care-team/useCareTeamQuestions";

interface CareTeamQuestionsSectionProps {
  hideTitle?: boolean;
}

export default function CareTeamQuestionsSection({
  hideTitle = false,
}: CareTeamQuestionsSectionProps = {}) {
  const { language } = useLanguage();

  const {
    questions,
    isPending,
    error,
    refetch,
    add,
    update,
    remove,
    cycleStatus,
    isSaving,
    saveError,
    dismissSaveError,
  } = useCareTeamQuestions();
  const [selectedRole, setSelectedRole] = useState<CareTeamRole | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | QuestionStatus>(
    "All",
  );

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRole, setFormRole] = useState<CareTeamRole>("Provider");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formStatus, setFormStatus] = useState<QuestionStatus>("Submitted");
  const [formError, setFormError] = useState("");

  const [pendingDelete, setPendingDelete] = useState<CareTeamQuestion | null>(
    null,
  );

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
        language === "ES"
          ? "Por favor escribe la pregunta."
          : "Please enter the question.",
      );
      return;
    }

    /* The modal closes when the question is stored, not when the button is
       pressed. This is the list a member opens in the chair; "I wrote that
       down" has to be true. */
    const written = editingId
      ? update(editingId, {
          role: formRole,
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          status: formStatus,
        })
      : add({
          id: crypto.randomUUID(),
          role: formRole,
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          status: statusForNew(formStatus, formAnswer),
        });

    void written
      .then(() => setIsModalOpen(false))
      .catch((cause: unknown) =>
        setFormError(
          cause instanceof Error
            ? cause.message
            : language === "ES"
              ? "No se pudo guardar."
              : "That could not be saved.",
        ),
      );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    void remove(pendingDelete.id)
      .then(() => setPendingDelete(null))
      .catch(() => {});
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
    /* A card of its own, headed the same way as Provider Orders above it. */
    <Card as="section" className="w-full space-y-6">
      {!hideTitle && (
        <SectionTitle
          title={
            language === "ES" ? "Preguntas al Equipo" : "Care Team Questions"
          }
          action={
            <Button onClick={handleOpenAddModal} className="shrink-0">
              <Plus aria-hidden="true" />
              <span>
                {language === "ES" ? "Hacer Pregunta" : "Add Question"}
              </span>
            </Button>
          }
        />
      )}

      {/* SINGLE UNIFIED ROW: Search (Small & First), Role Dropdown, Status Dropdown, and Add Question Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left cluster: Search Input (Small) followed by the 2 Dropdowns */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* 1. Search Bar (Small, placed before dropdowns) */}
          <div className="relative w-48 sm:w-56">
            <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
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
              onChange={(e) =>
                setSelectedRole(e.target.value as CareTeamRole | "All")
              }
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
              onChange={(e) =>
                setStatusFilter(e.target.value as "All" | QuestionStatus)
              }
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
      </div>

      {saveError ? (
        <Alert
          tone="danger"
          title={
            language === "ES" ? "El cambio no se guardó" : "Change not saved"
          }
          onDismiss={dismissSaveError}
        >
          {saveError instanceof Error
            ? saveError.message
            : language === "ES"
              ? "Inténtelo de nuevo."
              : "Please try again."}
        </Alert>
      ) : null}

      {/* Clean Q & Ans Card List */}
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        errorTitle={
          language === "ES"
            ? "Sus preguntas no se cargaron"
            : "Your questions did not load"
        }
        skeleton={
          <div className="space-y-3.5">
            <Skeleton height={130} />
            <Skeleton height={130} />
            <Skeleton height={130} />
          </div>
        }
      >
        <div className="space-y-3.5">
          {filteredQuestions.length === 0 ? (
            <div className="space-y-2 rounded-card border border-line bg-surface p-12 text-center text-fg-subtle">
              <HelpCircle className="mx-auto h-8 w-8 text-fg-subtle" />
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
                className="space-y-3 rounded-card border border-line bg-surface p-5 shadow-control transition-shadow hover:shadow-control sm:p-6"
              >
                {/* Question Row with Status Tag, Edit Button, and Delete */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <h3 className="text-base leading-snug font-semibold text-fg">
                      {q.question}
                    </h3>
                  </div>

                  {/* Status Tag, Edit Button & Delete */}
                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                    {/* Status Tag */}
                    <button
                      type="button"
                      onClick={() => cycleStatus(q.id)}
                      title={
                        language === "ES"
                          ? "Clic para cambiar estado (Pendiente → Discutida → Respondida)"
                          : "Click to cycle status (Submitted → Discussed → Answered)"
                      }
                      className={`cursor-pointer rounded-pill border px-3 py-1 text-xs font-bold shadow-control transition-all select-none active:scale-95 ${getStatusBadgeStyle(
                        q.status,
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
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1 text-xs font-semibold text-fg-secondary shadow-control transition-all hover:border-primary-soft-line hover:bg-primary-soft hover:text-fg-brand active:scale-95"
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
                      onClick={() => setPendingDelete(q)}
                      className="cursor-pointer rounded-control p-1.5 text-fg-subtle transition-colors hover:bg-danger-surface hover:text-danger"
                      title={language === "ES" ? "Eliminar" : "Delete"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Answer Row */}
                <div className="flex items-start gap-2.5 border-t border-line-subtle pt-3">
                  <span className="shrink-0 text-sm font-bold text-fg-secondary select-none">
                    Ans:
                  </span>
                  {q.answer && q.answer.trim().length > 0 ? (
                    <p className="flex-1 text-sm leading-relaxed font-normal text-fg-muted">
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
                        className="cursor-pointer font-semibold text-fg-brand not-italic hover:underline"
                      >
                        {language === "ES"
                          ? "+ Agregar Respuesta"
                          : "+ Add Answer"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </AsyncSection>

      {/* window.confirm blocks the page and leaves a failed delete nowhere
          to report itself. */}
      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        size="small"
        title={language === "ES" ? "Eliminar pregunta" : "Delete question"}
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setPendingDelete(null)}
              disabled={isSaving}
            >
              {language === "ES" ? "Cancelar" : "Cancel"}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={isSaving}>
              {language === "ES" ? "Eliminar" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-body-md text-fg-secondary">
          {pendingDelete?.question}
        </p>
      </Modal>

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
            <Button
              type="submit"
              form="care-team-question-form"
              loading={isSaving}
            >
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
            <label className="mb-stack-xs block text-overline text-fg-muted">
              {language === "ES"
                ? "Destinatario / Especialidad"
                : "Care Team Member"}{" "}
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
                {language === "ES"
                  ? "Trabajador Social (Social Worker)"
                  : "Social Worker"}
              </option>
              <option value="Nurse">
                {language === "ES" ? "Enfermero/a (Nurse)" : "Nurse"}
              </option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="mb-stack-xs block text-overline text-fg-muted">
              {language === "ES" ? "Pregunta" : "Question"}{" "}
              <span className="text-danger">*</span>
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
            <label className="mb-stack-xs block text-overline text-fg-muted">
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
            <label className="mb-stack-xs block text-overline text-fg-muted">
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
    </Card>
  );
}
