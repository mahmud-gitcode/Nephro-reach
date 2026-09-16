"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  CircleAlert,
  Clock,
  Frown,
  Meh,
  Send,
  Smile,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  COMMON_SYMPTOM_OPTIONS,
  LOCALIZED_SYMPTOMS,
} from "../record/record.options";
import {
  ACTIVITY_LEVELS,
  APPETITES,
  ENERGY_LEVELS,
  RECOVERY_WINDOWS,
} from "./checkIn.options";
import {
  canSave,
  checkInError,
  emptyCheckIn,
  relativeDayLabel,
  todayIso,
  toggleSymptom,
} from "./checkIn.rules";
import {
  isDelivered,
  nextClinicOpenDay,
  shouldSuggestNotice,
} from "./clinicNotice.rules";
import type { ClinicNotice } from "./clinicNotice.types";
import type {
  ActivityLevel,
  Appetite,
  BetweenTreatmentCheckIn,
  CheckInFeeling,
  CheckInSeverity,
  EnergyLevel,
  RecoveryWindow,
} from "./checkIn.types";
import {
  Alert,
  Button,
  Chip,
  ChipGroup,
  FormField,
  Input,
  Modal,
  Select,
  SwitchRow,
  Textarea,
} from "@/components/ui";

/* ==========================================================================
   Beyond the Chair — the check-in form
   --------------------------------------------------------------------------
   One check-in, for one day the member picks from a calendar.

   The old version asked which numbered gap between which two treatments an
   entry belonged to, and laid the days out as fixed blocks — Day 1 (Post-Tx),
   Day 2 (Interdialytic), Day 3. That only worked if the member had already
   worked out where in the schedule they were standing, and it broke whenever
   a treatment moved.

   Here the date is the whole answer, and one toggle — was this a treatment
   day — decides what else is worth asking. The recovery questions appear
   only on a treatment day, because "how long until you felt back to normal"
   has no meaning on a day with nothing to recover from.
   ========================================================================== */

const FEELINGS: {
  value: CheckInFeeling;
  icon: React.ElementType;
  labelEn: string;
  labelEs: string;
  tone: string;
}[] = [
  {
    value: "good",
    icon: Smile,
    labelEn: "Good",
    labelEs: "Bien",
    tone: "text-success",
  },
  {
    value: "okay",
    icon: Meh,
    labelEn: "Okay",
    labelEs: "Regular",
    tone: "text-warning",
  },
  {
    value: "rough",
    icon: Frown,
    labelEn: "Rough",
    labelEs: "Mal",
    tone: "text-danger",
  },
];

const SEVERITIES: {
  value: CheckInSeverity;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "mild", labelEn: "Mild", labelEs: "Leve" },
  { value: "moderate", labelEn: "Moderate", labelEs: "Moderado" },
  { value: "severe", labelEn: "Severe", labelEs: "Severo" },
];

/** A headed group inside the form, so a long form still reads in sections. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-stack-md border-t border-line pt-inset-md first:border-0 first:pt-0">
      <div>
        <h3 className="text-heading-5 text-fg">{title}</h3>
        {hint ? (
          <p className="mt-stack-xs text-body-sm text-fg-muted">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function CheckInForm({
  entry,
  notice,
  onSave,
  onCancel,
  saving = false,
}: {
  /** An existing day, reopened. Omit to check in for today. */
  entry?: BetweenTreatmentCheckIn;
  /** The notice already raised for this day, if there is one. */
  notice?: ClinicNotice | null;
  onSave: (entry: BetweenTreatmentCheckIn, notifyClinic: boolean) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [draft, setDraft] = useState<BetweenTreatmentCheckIn>(
    () => entry ?? emptyCheckIn(),
  );
  const [otherSymptom, setOtherSymptom] = useState("");

  /* `null` means the member has not touched the send toggle, so it keeps
     following the day they are describing — flipping "I missed a treatment"
     arms it. Once they set it themselves that choice stands, because a
     toggle that kept overriding them is one they would stop trusting. */
  const [notifyChoice, setNotifyChoice] = useState<boolean | null>(
    notice ? true : null,
  );

  const set = (patch: Partial<BetweenTreatmentCheckIn>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const error = checkInError(draft);
  const hasSymptoms = draft.symptoms.length > 0;

  /* Already at the clinic: the toggle shows what happened and cannot undo
     it. Nothing this form does can unread a message somebody has read. */
  const alreadySent = notice ? isDelivered(notice) : false;
  const notifyClinic =
    alreadySent || (notifyChoice ?? shouldSuggestNotice(draft));

  /* Dialysis centres here close on Sundays, so a send raised today may not
     land today. The member is told which day it lands before they send. */
  const today = todayIso();
  const deliversOn = nextClinicOpenDay(today);
  const heldForSunday = deliversOn !== today;

  const addOther = () => {
    const value = otherSymptom.trim();
    if (!value || draft.symptoms.includes(value)) return;
    set({ symptoms: [...draft.symptoms, value] });
    setOtherSymptom("");
  };

  const save = () =>
    onSave({ ...draft, savedAt: new Date().toISOString() }, notifyClinic);

  return (
    <Modal
      open
      size="wide"
      onClose={onCancel}
      title={
        entry
          ? isEs
            ? "Editar registro"
            : "Edit check-in"
          : isEs
            ? "Nuevo registro"
            : "New check-in"
      }
      description={
        isEs
          ? "Un registro por día. Todo menos el día es opcional."
          : "One check-in a day. Everything except the day is optional."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke" onClick={onCancel}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            type="button"
            disabled={!canSave(draft) || saving}
            onClick={save}
          >
            {saving
              ? isEs
                ? "Guardando…"
                : "Saving…"
              : isEs
                ? "Guardar registro"
                : "Save check-in"}
          </Button>
        </div>
      }
    >
      <div className="space-y-stack-lg">
        <Section
          title={isEs ? "El día" : "The day"}
          hint={
            isEs
              ? "Elige el día. Puedes registrar un día anterior si lo olvidaste."
              : "Pick the day. You can log an earlier day if you forgot one."
          }
        >
          <FormField
            label={
              isEs
                ? "¿Qué día estás registrando?"
                : "Which day are you logging?"
            }
            error={
              error === "future-date"
                ? isEs
                  ? "Ese día aún no ha llegado."
                  : "That day has not happened yet."
                : error === "invalid-date"
                  ? isEs
                    ? "Elige un día válido."
                    : "Pick a valid day."
                  : undefined
            }
          >
            {(props) => (
              <div className="flex flex-wrap items-center gap-inline-md">
                <Input
                  {...props}
                  type="date"
                  value={draft.date}
                  max={todayIso()}
                  onChange={(event) => set({ date: event.target.value })}
                  leadingIcon={
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  }
                  className="sm:w-[240px]"
                />
                <span className="text-body-sm text-fg-muted">
                  {relativeDayLabel(draft.date, isEs)}
                </span>
              </div>
            )}
          </FormField>

          {/* This one toggle decides what the rest of the form asks, and it is
            what makes "treatment days versus the days between" answerable. */}
          <SwitchRow
            checked={draft.treatmentDay}
            onChange={(checked) => set({ treatmentDay: checked })}
            title={
              isEs
                ? "Tuve tratamiento este día"
                : "I had a treatment on this day"
            }
            description={
              isEs
                ? "Así podemos comparar los días de tratamiento con los demás."
                : "This is what lets us compare treatment days with the days between."
            }
          />

          <FormField
            label={
              isEs ? "¿Cómo te sentiste ese día?" : "How did you feel that day?"
            }
          >
            {() => (
              <div className="flex flex-wrap gap-inline-md">
                {FEELINGS.map((option) => {
                  const Icon = option.icon;
                  const selected = draft.feeling === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => set({ feeling: option.value })}
                      className={`flex min-w-[104px] flex-1 cursor-pointer flex-col items-center gap-inline-sm rounded-card border px-inset-sm py-inset-sm transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                        selected
                          ? "border-primary-soft-line bg-primary-soft"
                          : "border-line bg-surface hover:bg-surface-sunken"
                      }`}
                    >
                      <Icon
                        aria-hidden="true"
                        className={`h-6 w-6 ${selected ? option.tone : "text-fg-muted"}`}
                      />
                      <span className="text-label-md text-fg">
                        {isEs ? option.labelEs : option.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </FormField>
        </Section>

        {/* Recovery only exists after a treatment. Asking a member how long
          they took to recover on a day they did not dialyse is a question
          with no answer. */}
        {draft.treatmentDay ? (
          <Section
            title={isEs ? "Recuperación" : "Recovery"}
            hint={
              isEs
                ? "Cómo te fue después de llegar a casa."
                : "How it went after you got home."
            }
          >
            <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
              <FormField
                label={
                  isEs
                    ? "¿Cuánto tardaste en recuperarte?"
                    : "How long did recovery take?"
                }
                optionalLabel={isEs ? "opcional" : "optional"}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={draft.recoveryWindow ?? ""}
                    onChange={(event) =>
                      set({
                        recoveryWindow:
                          (event.target.value as RecoveryWindow) || undefined,
                      })
                    }
                  >
                    <option value="">
                      {isEs ? "Sin especificar" : "Not set"}
                    </option>
                    {RECOVERY_WINDOWS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {isEs ? option.labelEs : option.labelEn}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              <FormField
                label={
                  isEs
                    ? "Hora en que te sentiste normal"
                    : "Time you felt back to normal"
                }
                optionalLabel={isEs ? "opcional" : "optional"}
              >
                {(props) => (
                  <Input
                    {...props}
                    type="time"
                    value={draft.backToNormalAt ?? ""}
                    onChange={(event) =>
                      set({ backToNormalAt: event.target.value || undefined })
                    }
                  />
                )}
              </FormField>

              <FormField
                label={isEs ? "Nivel de energía" : "Energy level"}
                optionalLabel={isEs ? "opcional" : "optional"}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={draft.energyLevel ?? ""}
                    onChange={(event) =>
                      set({
                        energyLevel: event.target.value
                          ? (Number(event.target.value) as EnergyLevel)
                          : undefined,
                      })
                    }
                  >
                    <option value="">
                      {isEs ? "Sin especificar" : "Not set"}
                    </option>
                    {ENERGY_LEVELS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {isEs ? option.labelEs : option.labelEn}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              <FormField
                label={
                  isEs
                    ? "¿Pudiste hacer tus actividades habituales?"
                    : "Could you do your usual activities?"
                }
                optionalLabel={isEs ? "opcional" : "optional"}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={draft.resumedActivities ?? ""}
                    onChange={(event) =>
                      set({
                        resumedActivities:
                          (event.target.value as ActivityLevel) || undefined,
                      })
                    }
                  >
                    <option value="">
                      {isEs ? "Sin especificar" : "Not set"}
                    </option>
                    {ACTIVITY_LEVELS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {isEs ? option.labelEs : option.labelEn}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>
          </Section>
        ) : null}

        <Section
          title={isEs ? "Síntomas" : "Symptoms"}
          hint={
            isEs
              ? "Toca los que tuviste. Deja vacío si no tuviste ninguno."
              : "Tap any you had. Leave it empty if you had none."
          }
        >
          <ChipGroup
            label={isEs ? "Síntomas" : "Symptoms"}
            selection="multiple"
          >
            {COMMON_SYMPTOM_OPTIONS.map((symptom) => (
              <Chip
                key={symptom}
                selected={draft.symptoms.includes(symptom)}
                onClick={() =>
                  set({ symptoms: toggleSymptom(draft.symptoms, symptom) })
                }
              >
                {isEs ? LOCALIZED_SYMPTOMS[symptom] || symptom : symptom}
              </Chip>
            ))}
            {/* Anything typed in shows as a chip too, so it can be removed the
              same way it was added. */}
            {draft.symptoms
              .filter((symptom) => !COMMON_SYMPTOM_OPTIONS.includes(symptom))
              .map((symptom) => (
                <Chip
                  key={symptom}
                  selected
                  onRemove={() =>
                    set({ symptoms: toggleSymptom(draft.symptoms, symptom) })
                  }
                >
                  {symptom}
                </Chip>
              ))}
          </ChipGroup>

          <Input
            value={otherSymptom}
            onChange={(event) => setOtherSymptom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                /* Inside a form, Enter would submit and lose the word. */
                event.preventDefault();
                addOther();
              }
            }}
            onBlur={addOther}
            aria-label={isEs ? "Agregar otro síntoma" : "Add another symptom"}
            placeholder={
              isEs
                ? "¿Otro síntoma? Escríbelo y pulsa Enter"
                : "Another symptom? Type it and press Enter"
            }
            inputSize="small"
          />

          {/* Severity means something only once a symptom exists — asking "how
            severe?" of a member who had none is noise. */}
          {hasSymptoms ? (
            <FormField label={isEs ? "Qué tan fuerte" : "How bad was it"}>
              {(props) => (
                <Select
                  {...props}
                  value={draft.severity}
                  onChange={(event) =>
                    set({ severity: event.target.value as CheckInSeverity })
                  }
                  className="sm:w-[240px]"
                >
                  {SEVERITIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {isEs ? option.labelEs : option.labelEn}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          ) : null}
        </Section>

        <Section
          title={isEs ? "Mediciones" : "Readings"}
          hint={
            isEs
              ? "Solo lo que hayas medido. Todo es opcional."
              : "Only what you measured. All of it is optional."
          }
        >
          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
            <FormField
              label={isEs ? "Presión arterial" : "Blood pressure"}
              hint={isEs ? "Por ejemplo 128/74" : "For example 128/74"}
              optionalLabel={isEs ? "opcional" : "optional"}
            >
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  value={draft.bloodPressure ?? ""}
                  onChange={(event) =>
                    set({ bloodPressure: event.target.value || undefined })
                  }
                  placeholder="128/74"
                />
              )}
            </FormField>

            <FormField
              label={isEs ? "Peso" : "Weight"}
              optionalLabel={isEs ? "opcional" : "optional"}
            >
              {(props) => (
                <Input
                  {...props}
                  inputMode="decimal"
                  value={draft.weight ?? ""}
                  onChange={(event) =>
                    set({ weight: event.target.value || undefined })
                  }
                  placeholder="72.4"
                />
              )}
            </FormField>

            <FormField
              label={
                isEs ? "Orina en 24 horas (mL)" : "24-hour urine output (mL)"
              }
              optionalLabel={isEs ? "opcional" : "optional"}
            >
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  value={draft.urineOutputMl ?? ""}
                  onChange={(event) =>
                    set({ urineOutputMl: event.target.value || undefined })
                  }
                  placeholder="500"
                />
              )}
            </FormField>

            <FormField
              label={isEs ? "Apetito" : "Appetite"}
              optionalLabel={isEs ? "opcional" : "optional"}
            >
              {(props) => (
                <Select
                  {...props}
                  value={draft.appetite ?? ""}
                  onChange={(event) =>
                    set({
                      appetite: (event.target.value as Appetite) || undefined,
                    })
                  }
                >
                  <option value="">
                    {isEs ? "Sin especificar" : "Not set"}
                  </option>
                  {APPETITES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {isEs ? option.labelEs : option.labelEn}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
        </Section>

        <Section title={isEs ? "Notas" : "Notes"}>
          <SwitchRow
            checked={draft.missedTreatment}
            onChange={(checked) => set({ missedTreatment: checked })}
            title={
              isEs
                ? "Falté a un tratamiento este día"
                : "I missed a treatment on this day"
            }
            description={
              isEs
                ? "Tu equipo necesita saberlo, aunque hayas tenido un buen día."
                : "Your team needs to know, even if the day itself went fine."
            }
          />

          {/* This banner used to read "this log does not notify them", which
            left a member who had just missed a run to phone it in on their
            own. Beyond the Chair is the only record of the days between
            treatments, so it is the one log that has to be able to reach the
            clinic — and the member decides, per day, whether it does. */}
          <SwitchRow
            checked={notifyClinic}
            disabled={alreadySent}
            onChange={setNotifyChoice}
            title={
              isEs
                ? "Enviar este día a mi clínica"
                : "Send this day to my clinic"
            }
            description={
              alreadySent && notice
                ? isEs
                  ? `Enviado el ${relativeDayLabel(notice.deliverOn, true).toLowerCase()}. Esto ya no se puede retirar.`
                  : `Sent ${relativeDayLabel(notice.deliverOn, false).toLowerCase()}. This can no longer be taken back.`
                : isEs
                  ? "Tu equipo verá los síntomas y las medidas que anotaste para este día."
                  : "Your care team sees the symptoms and readings you logged for this day."
            }
          />

          {alreadySent ? null : notifyClinic ? (
            heldForSunday ? (
              <Alert tone="info" icon={<Clock aria-hidden="true" />}>
                {isEs
                  ? `Tu clínica cierra los domingos. Esto les llegará el ${relativeDayLabel(deliversOn, true).toLowerCase()}.`
                  : `Your clinic is closed on Sundays. This will reach them ${relativeDayLabel(deliversOn, false).toLowerCase()}.`}
              </Alert>
            ) : (
              <Alert tone="success" icon={<Send aria-hidden="true" />}>
                {isEs
                  ? "Tu clínica recibirá este día cuando guardes."
                  : "Your clinic gets this day when you save."}
              </Alert>
            )
          ) : draft.missedTreatment ? (
            <Alert tone="warning" icon={<CircleAlert aria-hidden="true" />}>
              {isEs
                ? "Avisa a tu clínica lo antes posible: este registro no se enviará."
                : "Tell your clinic as soon as you can — this check-in will not be sent."}
            </Alert>
          ) : null}

          <FormField
            label={isEs ? "Cómo te fue" : "How the day went"}
            optionalLabel={isEs ? "opcional" : "optional"}
            hint={
              isEs
                ? "Cualquier cosa que quieras contarle a tu equipo en la próxima cita."
                : "Anything you want to tell your team at the next appointment."
            }
          >
            {(props) => (
              <Textarea
                {...props}
                rows={4}
                value={draft.notes}
                onChange={(event) => set({ notes: event.target.value })}
              />
            )}
          </FormField>
        </Section>
      </div>
    </Modal>
  );
}

export default CheckInForm;
