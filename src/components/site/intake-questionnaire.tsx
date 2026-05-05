"use client";

import type {
  FormEvent,
  InputHTMLAttributes,
  MouseEvent,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { QUESTIONNAIRE_TEXT_FIELD_MAX_LENGTH } from "@/modules/forms/constants";

import styles from "./intake-questionnaire.module.css";

type IntakeQuestionnaireProps = {
  appointmentId: string;
  initialName: string;
  initialBirthDate?: string | null;
  initialSex?: string | null;
};

type RowItem = { id: string };
type TableColumn = { label: string; name: string; placeholder: string };
type CalendarDay = {
  value: string;
  dayOfMonth: number;
  currentMonth: boolean;
  disabled: boolean;
};
type SelectOption = {
  value: string;
  label: string;
};
type CalendarViewMode = "days" | "months" | "years";

const steps = [
  { key: "general", label: "Informatii generale" },
  { key: "family", label: "Antecedente familiale" },
  { key: "personal", label: "Antecedente personale" },
  { key: "health", label: "Stare de sanatate" },
  { key: "activity", label: "Activitate fizica" },
  { key: "nutrition", label: "Informatii nutritionale" },
];

const antecedenteOptions = [
  ["Hipercolesterolemie / Diabet zaharat", "Hipercolesterolemie, Diabet zaharat (tip 1 sau tip 2)"],
  ["Hipertensiune arteriala", "Hipertensiune arteriala"],
  ["Boli de inima", "Boli de inima"],
  ["Cancer", "Cancer"],
  ["Boli tiroidiene / Obezitate", "Boli tiroidiene, Obezitate"],
  ["Boli renale", "Boli renale"],
  ["Altele", "Altele"],
] as const;

const femeiOptions = [
  "Menstre regulate, normale cantitativ",
  "Menstre regulate, dureroase, abundente",
  "Premenopauza",
  "Menopauza",
  "Altele",
] as const;

const grasimiOptions = [
  "Unt",
  "Margarina",
  "Ulei de masline",
  "Ulei de in",
  "Ulei de floarea soarelui",
  "Ulei de porumb",
  "Ulei de rapita",
  "Ulei de soia",
] as const;

const bauturiOptions = [
  "Apa",
  "Cafea",
  "Ceai",
  "Sucuri naturale",
  "Lapte 3,5%",
  "Lapte degresat",
  "Sucuri carbogazoase",
  "Lapte vegetal",
  "Altele",
] as const;

const pofteOptions = [
  "Dulciuri",
  "Paine",
  "Alimente grase",
  "Mezeluri",
  "Snacksuri",
  "Altele",
] as const;

const weekdayLabels = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];
const monthLabels = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
] as const;
const sexOptions: SelectOption[] = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Feminin" },
];
const maritalStatusOptions: SelectOption[] = [
  { value: "Necasatorit", label: "Necasatorit(a)" },
  { value: "Casatorit", label: "Casatorit(a)" },
  { value: "Divortat", label: "Divortat(a)" },
  { value: "Vaduv", label: "Vaduv(a)" },
];

function LimitedTextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      maxLength={props.maxLength ?? QUESTIONNAIRE_TEXT_FIELD_MAX_LENGTH}
      type={props.type ?? "text"}
    />
  );
}

function LimitedTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      maxLength={props.maxLength ?? QUESTIONNAIRE_TEXT_FIELD_MAX_LENGTH}
    />
  );
}

function createRow(): RowItem {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function buildCalendarDays(visibleMonth: Date, maxDate: Date): CalendarDay[] {
  const firstDayOfMonth = startOfMonth(visibleMonth);
  const offset = (firstDayOfMonth.getDay() + 6) % 7;
  const firstVisibleDay = new Date(firstDayOfMonth);
  firstVisibleDay.setDate(firstDayOfMonth.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(firstVisibleDay);
    current.setDate(firstVisibleDay.getDate() + index);
    const normalized = new Date(current.getFullYear(), current.getMonth(), current.getDate());

    return {
      value: toDateValue(normalized),
      dayOfMonth: normalized.getDate(),
      currentMonth: isSameMonth(normalized, visibleMonth),
      disabled: normalized > maxDate,
    };
  });
}

function formatDisplayDate(value: string) {
  const date = parseDateValue(value);

  if (!date) {
    return "zz/ll/aaaa";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none">
      <path
        d="M6 2.75V5M14 2.75V5M3.75 7.25H16.25M5.5 4H14.5C15.4665 4 16.25 4.7835 16.25 5.75V14.5C16.25 15.4665 15.4665 16.25 14.5 16.25H5.5C4.5335 16.25 3.75 15.4665 3.75 14.5V5.75C3.75 4.7835 4.5335 4 5.5 4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none">
      <path
        d="M3.25 8H12.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none">
      <path
        d="M8 3.25V12.75M3.25 8H12.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
      <path
        d="M9.75 3.5L5.25 8L9.75 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
      <path
        d="M6.25 3.5L10.75 8L6.25 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SelectChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
      <path
        d="M4 6.25L8 10.25L12 6.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function NumberStepperInput({
  className,
  step,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function adjustValue(direction: -1 | 1) {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    const stepValue = Number(step ?? input.step ?? 1) || 1;
    const minValue = input.min === "" ? Number.NEGATIVE_INFINITY : Number(input.min);
    const maxValue = input.max === "" ? Number.POSITIVE_INFINITY : Number(input.max);
    const baseValue =
      input.value === ""
        ? Number.isFinite(minValue)
          ? minValue
          : 0
        : Number(input.value);
    const nextValue = Math.min(maxValue, Math.max(minValue, baseValue + stepValue * direction));

    input.value = Number.isFinite(nextValue) ? `${nextValue}` : "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
  }

  return (
    <div className={styles.numberInput}>
      <input
        {...props}
        className={[styles.input, styles.numberInputField, className].filter(Boolean).join(" ")}
        ref={inputRef}
        step={step}
        type="number"
      />
      <div className={styles.numberControls}>
        <button
          aria-label="Scade valoarea"
          className={styles.numberControl}
          onClick={() => adjustValue(-1)}
          type="button"
        >
          <MinusIcon />
        </button>
        <button
          aria-label="Creste valoarea"
          className={styles.numberControl}
          onClick={() => adjustValue(1)}
          type="button"
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}

function StyledSelect({
  id,
  name,
  options,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  required,
}: {
  id: string;
  name: string;
  options: SelectOption[];
  placeholder: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? value ?? "");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === currentValue) ?? null;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div className={styles.customSelectWrap} ref={containerRef}>
      <input
        className={styles.srOnlyInput}
        name={name}
        onChange={() => {}}
        required={required}
        tabIndex={-1}
        type="text"
        value={currentValue}
      />
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${styles.customSelectButton}${open ? ` ${styles.customSelectButtonOpen}` : ""}`}
        id={id}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span
          className={`${styles.customSelectValue}${selectedOption ? "" : ` ${styles.customSelectPlaceholder}`}`}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <span className={styles.customSelectIcon}>
          <SelectChevronIcon />
        </span>
      </button>

      {open ? (
        <div aria-labelledby={id} className={styles.customSelectMenu} role="listbox">
          {options.map((option) => {
            const isSelected = option.value === currentValue;

            return (
              <button
                aria-selected={isSelected}
                className={`${styles.customSelectOption}${isSelected ? ` ${styles.customSelectOptionSelected}` : ""}`}
                key={option.value}
                onClick={() => handleSelect(option.value)}
                role="option"
                type="button"
              >
                <span className={styles.customSelectOptionLabel}>{option.label}</span>
                <span className={styles.customSelectOptionCheck} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CompactDatePicker({
  id,
  name,
  initialValue,
}: {
  id: string;
  name: string;
  initialValue?: string | null;
}) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const [value, setValue] = useState(initialValue ?? "");
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("days");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const parsed = parseDateValue(initialValue);
    return parsed ? startOfMonth(parsed) : startOfMonth(today);
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setViewMode("days");
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setViewMode("days");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const days = useMemo(() => buildCalendarDays(visibleMonth, today), [today, visibleMonth]);
  const currentMonth = startOfMonth(today);
  const currentYear = today.getFullYear();
  const selectedDate = parseDateValue(value);
  const canGoForward =
    viewMode === "days"
      ? visibleMonth < currentMonth
      : viewMode === "months"
        ? visibleMonth.getFullYear() < currentYear
        : Math.min(currentYear, Math.floor(visibleMonth.getFullYear() / 12) * 12 + 11) < currentYear;
  const yearRangeStart = Math.floor(visibleMonth.getFullYear() / 12) * 12;
  const monthItems = monthLabels.map((label, index) => ({
    label: label.slice(0, 3),
    fullLabel: label,
    value: index,
    disabled: visibleMonth.getFullYear() === currentYear && index > today.getMonth(),
  }));
  const yearItems = Array.from({ length: 12 }, (_, index) => {
    const year = yearRangeStart + index;

    return {
      year,
      disabled: year > currentYear,
    };
  });

  function handleSelect(nextValue: string) {
    setValue(nextValue);
    setOpen(false);
    setViewMode("days");
  }

  function stepBackward() {
    setVisibleMonth((current) => {
      if (viewMode === "days") {
        return addMonths(current, -1);
      }

      if (viewMode === "months") {
        return new Date(current.getFullYear() - 1, current.getMonth(), 1);
      }

      return new Date(current.getFullYear() - 12, current.getMonth(), 1);
    });
  }

  function stepForward() {
    setVisibleMonth((current) => {
      if (viewMode === "days") {
        return addMonths(current, 1);
      }

      if (viewMode === "months") {
        return new Date(current.getFullYear() + 1, current.getMonth(), 1);
      }

      return new Date(current.getFullYear() + 12, current.getMonth(), 1);
    });
  }

  function openPicker() {
    setOpen((current) => {
      if (!current) {
        setViewMode("days");
      }

      return !current;
    });
  }

  return (
    <div className={styles.dateFieldWrap} ref={containerRef}>
      <input name={name} readOnly type="hidden" value={value} />
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`${styles.dateButton}${open ? ` ${styles.dateButtonOpen}` : ""}`}
        id={id}
        onClick={openPicker}
        type="button"
      >
        <span className={`${styles.dateButtonValue}${value ? "" : ` ${styles.dateButtonPlaceholder}`}`}>
          {formatDisplayDate(value)}
        </span>
        <span className={styles.dateButtonIcon}>
          <CalendarIcon />
        </span>
      </button>

      {open ? (
        <div aria-label="Alege data nasterii" className={styles.datePopover} role="dialog">
          <div className={styles.datePopoverHeader}>
            <button
              className={styles.datePopoverTitle}
              onClick={() =>
                setViewMode((current) =>
                  current === "days" ? "months" : current === "months" ? "years" : "years",
                )
              }
              type="button"
            >
              {viewMode === "days"
                ? `${monthLabels[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`
                : viewMode === "months"
                  ? `${visibleMonth.getFullYear()}`
                  : `${yearRangeStart} - ${yearRangeStart + 11}`}
            </button>
            <div className={styles.datePopoverControls}>
              <button
                aria-label={
                  viewMode === "days"
                    ? "Luna anterioara"
                    : viewMode === "months"
                      ? "Anul anterior"
                      : "Intervalul anterior de ani"
                }
                className={styles.datePopoverControl}
                onClick={stepBackward}
                type="button"
              >
                <ChevronLeftIcon />
              </button>
              <button
                aria-label={
                  viewMode === "days"
                    ? "Luna urmatoare"
                    : viewMode === "months"
                      ? "Anul urmator"
                      : "Intervalul urmator de ani"
                }
                className={styles.datePopoverControl}
                disabled={!canGoForward}
                onClick={stepForward}
                type="button"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          {viewMode === "days" ? (
            <>
              <div className={styles.dateWeekdays}>
                {weekdayLabels.map((label) => (
                  <span key={label} className={styles.dateWeekday}>
                    {label}
                  </span>
                ))}
              </div>

              <div className={styles.dateGrid}>
                {days.map((day) => {
                  const isSelected = day.value === value;

                  return (
                    <button
                      key={day.value}
                      className={[
                        styles.dateDay,
                        !day.currentMonth ? styles.dateDayMuted : "",
                        day.disabled ? styles.dateDayDisabled : "",
                        isSelected ? styles.dateDaySelected : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={day.disabled}
                      onClick={() => handleSelect(day.value)}
                      type="button"
                    >
                      {day.dayOfMonth}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {viewMode === "months" ? (
            <div className={styles.dateZoomGrid}>
              {monthItems.map((month) => {
                const isSelected =
                  selectedDate?.getFullYear() === visibleMonth.getFullYear() &&
                  selectedDate.getMonth() === month.value;

                return (
                  <button
                    key={month.fullLabel}
                    className={[
                      styles.dateZoomItem,
                      month.disabled ? styles.dateZoomItemDisabled : "",
                      isSelected ? styles.dateZoomItemSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={month.disabled}
                    onClick={() => {
                      setVisibleMonth(new Date(visibleMonth.getFullYear(), month.value, 1));
                      setViewMode("days");
                    }}
                    type="button"
                  >
                    {month.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {viewMode === "years" ? (
            <div className={styles.dateZoomGrid}>
              {yearItems.map((item) => {
                const isSelected = selectedDate?.getFullYear() === item.year;

                return (
                  <button
                    key={item.year}
                    className={[
                      styles.dateZoomItem,
                      item.disabled ? styles.dateZoomItemDisabled : "",
                      isSelected ? styles.dateZoomItemSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={item.disabled}
                    onClick={() => {
                      setVisibleMonth(new Date(item.year, visibleMonth.getMonth(), 1));
                      setViewMode("months");
                    }}
                    type="button"
                  >
                    {item.year}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className={styles.datePopoverFooter}>
            <button
              className={styles.datePopoverAction}
              disabled={!value}
              onClick={() => {
                setValue("");
                setViewMode("days");
              }}
              type="button"
            >
              Sterge
            </button>
            <button
              className={styles.datePopoverAction}
              onClick={() => {
                const nextValue = toDateValue(today);
                setVisibleMonth(startOfMonth(today));
                handleSelect(nextValue);
              }}
              type="button"
            >
              Astazi
            </button>
          </div>
        </div>
      ) : null}

      {selectedDate ? (
        <p className={styles.dateHelper}>
          Selectata:{" "}
          {new Intl.DateTimeFormat("ro-RO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(selectedDate)}
        </p>
      ) : null}
    </div>
  );
}

function RepeatableTable({
  columns,
  rows,
  addLabel,
  onAdd,
  onRemove,
}: {
  columns: TableColumn[];
  rows: RowItem[];
  addLabel: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.name}>{column.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={`${row.id}-${column.name}`}>
                    <LimitedTextInput name={column.name} placeholder={column.placeholder} />
                  </td>
                ))}
                <td>
                  <button
                    aria-label="Sterge randul"
                    className={styles.removeButton}
                    onClick={() => onRemove(row.id)}
                    type="button"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className={styles.addButton} onClick={onAdd} type="button">
        {addLabel}
      </button>
    </>
  );
}

function StepShell({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className={styles.stepHeading}>
        <span className={styles.stepIndex}>{String(index).padStart(2, "0")}.</span>
        <h2 className={styles.stepTitle}>{title}</h2>
      </div>
      {children}
    </>
  );
}

function StepPane({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden={!active}
      className={active ? styles.stepPane : styles.stepPaneHidden}
    >
      {children}
    </div>
  );
}

export function IntakeQuestionnaire({
  appointmentId,
  initialName,
  initialBirthDate,
  initialSex,
}: IntakeQuestionnaireProps) {
  const hasStepMountedRef = useRef(false);
  const sectionTopRef = useRef<HTMLDivElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [sex, setSex] = useState(initialSex === "F" || initialSex === "M" ? initialSex : "");
  const [interventiiBoli, setInterventiiBoli] = useState("");
  const [fumati, setFumati] = useState("");
  const [alcool, setAlcool] = useState("");
  const [practiciReligioase, setPracticiReligioase] = useState("Nu");
  const [poftaMancare, setPoftaMancare] = useState("");
  const [laxative, setLaxative] = useState("");
  const [activitateFizica, setActivitateFizica] = useState("Nu");
  const [antecedenteOther, setAntecedenteOther] = useState(false);
  const [femeiOther, setFemeiOther] = useState(false);
  const [declansatoriOther, setDeclansatoriOther] = useState(false);
  const [bauturiOther, setBauturiOther] = useState(false);
  const [pofteOther, setPofteOther] = useState(false);
  const [medicamenteEnabled, setMedicamenteEnabled] = useState(false);
  const [suplimenteEnabled, setSuplimenteEnabled] = useState(false);
  const [alergiiEnabled, setAlergiiEnabled] = useState(false);
  const [dieteEnabled, setDieteEnabled] = useState(false);
  const [medicamenteRows, setMedicamenteRows] = useState<RowItem[]>([]);
  const [suplimenteRows, setSuplimenteRows] = useState<RowItem[]>([]);
  const [alergiiRows, setAlergiiRows] = useState<RowItem[]>([]);
  const [dieteRows, setDieteRows] = useState<RowItem[]>([]);
  const [alimenteConsumateRows, setAlimenteConsumateRows] = useState<RowItem[]>([]);
  const [displaceriRows, setDisplaceriRows] = useState<RowItem[]>([]);
  const [alimentatieRows, setAlimentatieRows] = useState<RowItem[]>([]);
  const [submitState, setSubmitState] = useState<{
    type: "idle" | "loading" | "error" | "success";
    message?: string;
  }>({ type: "idle" });

  useEffect(() => {
    if (!hasStepMountedRef.current) {
      hasStepMountedRef.current = true;
      return;
    }

    const node = sectionTopRef.current;

    if (!node) {
      return;
    }

    const top = window.scrollY + node.getBoundingClientRect().top - 110;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth",
    });
  }, [currentStep]);

  function handleStepNavigation(
    event: MouseEvent<HTMLButtonElement>,
    nextStep: number,
  ) {
    event.preventDefault();
    setCurrentStep(nextStep);
  }

  function toggleRows(
    enabled: boolean,
    rows: RowItem[],
    setter: (rows: RowItem[]) => void,
  ) {
    setter(enabled ? (rows.length ? rows : [createRow()]) : []);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setSubmitState({ type: "loading" });
    const response = await fetch("/api/forms/nutrition-intake/submit", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setSubmitState({
        type: "error",
        message:
          payload.error ??
          "Nu am putut trimite Chestionarul Evaluare Nutritionala.",
      });
      return;
    }

    setSubmitState({
      type: "success",
      message:
        "Chestionarul Evaluare Nutritionala a fost trimis. Redirectionam catre statusul programarii...",
    });

    window.setTimeout(() => {
      window.location.assign("/programare/status");
    }, 700);
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <form onSubmit={handleSubmit}>
      <input name="event_id" type="hidden" value={appointmentId} />
      <div className={styles.root}>
        <aside className={styles.aside}>
          <h2 className={styles.asideTitle}>Chestionar Evaluare Nutritionala</h2>
          <p className={styles.asideStep}>
            Pasul {currentStep + 1} din {steps.length}
          </p>
          <nav className={styles.nav}>
            {steps.map((step, index) => (
              <button
                key={step.key}
                className={`${styles.navButton}${index === currentStep ? ` ${styles.navButtonActive}` : ""}`}
                onClick={(event) => handleStepNavigation(event, index)}
                type="button"
              >
                <span className={styles.navIndex}>{index + 1}</span>
                <span className={styles.navLabel}>{step.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div>
          <div className={styles.hero}>
            <p className={styles.eyebrow}>Prima vizita</p>
            <h1 className={styles.title}>Chestionar evaluare nutritionala</h1>
            <p className={styles.description}>
              Pastrezi aceleasi intrebari din formularul legacy, dar intr-o experienta mai clara si
              mai usor de reluat. Datele se salveaza pe profilul tau de pacient si se leaga de
              programarea curenta.
            </p>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={styles.panel}>
            <div ref={sectionTopRef} />
            <StepPane active={currentStep === 0}>
              <StepShell index={1} title="Informatii generale">
                <div className={styles.grid}>
                  <div className={styles.fieldFull}>
                    <label className={styles.label} htmlFor="q_name">
                      Nume complet
                    </label>
                    <LimitedTextInput
                      className={styles.input}
                      defaultValue={initialName}
                      id="q_name"
                      name="name"
                      required
                    />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="q_age">
                      Varsta
                    </label>
                    <NumberStepperInput id="q_age" name="age" required />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="q_birth">
                      Data nasterii
                    </label>
                    <CompactDatePicker
                      id="q_birth"
                      initialValue={initialBirthDate ?? ""}
                      name="birth_date"
                    />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="q_sex">
                      Sex
                    </label>
                    <StyledSelect
                      id="q_sex"
                      name="sex"
                      onValueChange={setSex}
                      options={sexOptions}
                      placeholder="Alege..."
                      required
                      value={sex}
                    />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="q_marital">
                      Stare civila
                    </label>
                    <StyledSelect
                      defaultValue=""
                      id="q_marital"
                      name="marital_status"
                      options={maritalStatusOptions}
                      placeholder="Alege..."
                    />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="q_children">
                      Copii
                    </label>
                    <NumberStepperInput id="q_children" min={0} name="children" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="q_height">
                      Inaltime (cm)
                    </label>
                    <NumberStepperInput id="q_height" name="height" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="q_weight">
                      Greutate (kg)
                    </label>
                    <NumberStepperInput id="q_weight" name="weight" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="q_ideal_weight">
                      Greutate ideala (kg)
                    </label>
                    <NumberStepperInput id="q_ideal_weight" name="ideal_weight" />
                  </div>
                </div>
              </StepShell>
            </StepPane>

            <StepPane active={currentStep === 1}>
              <StepShell index={2} title="Antecedente familiale">
                <div className={styles.options}>
                  {antecedenteOptions.map(([value, label]) => (
                    <label className={styles.option} key={value}>
                      <input
                        name="antecedente_familiale[]"
                        onChange={(event) => value === "Altele" && setAntecedenteOther(event.target.checked)}
                        type="checkbox"
                        value={value}
                      />
                      <span className={styles.optionLabel}>{label}</span>
                    </label>
                  ))}
                </div>
                {antecedenteOther ? (
                  <div className={styles.fieldFull} style={{ marginTop: "1rem" }}>
                    <label className={styles.label} htmlFor="antecedente_altele_descriere">
                      Specifica alte boli
                    </label>
                    <LimitedTextarea
                      className={styles.textarea}
                      id="antecedente_altele_descriere"
                      name="antecedente_altele_descriere"
                    />
                  </div>
                ) : null}
              </StepShell>
            </StepPane>

            <StepPane active={currentStep === 2}>
              <StepShell index={3} title="Antecedente personale">
                <div className={styles.grid}>
                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      1. Ati avut interventii chirurgicale / aveti boli cronice?
                    </label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={interventiiBoli === value}
                            name="interventii_boli"
                            onChange={(event) => setInterventiiBoli(event.target.value)}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {interventiiBoli === "Da" ? (
                      <LimitedTextarea
                        className={styles.textarea}
                        name="interventii_boli_descriere"
                        placeholder="Descrieti interventiile sau bolile..."
                        style={{ marginTop: "1rem" }}
                      />
                    ) : null}
                  </div>
                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      2. Ati luat sau pierdut in greutate recent? Daca da, explicati modificarile:
                    </label>
                    <LimitedTextarea className={styles.textarea} name="modificari_greutate" />
                  </div>
                  {sex === "F" ? (
                    <div className={styles.fieldFull}>
                      <label className={styles.label}>
                        3. Daca sunteti femeie, selectati una sau mai multe optiuni:
                      </label>
                      <div className={styles.options}>
                        {femeiOptions.map((option) => (
                          <label className={styles.option} key={option}>
                            <input
                              name="femeie_menstruatie[]"
                              onChange={(event) => option === "Altele" && setFemeiOther(event.target.checked)}
                              type="checkbox"
                              value={option}
                            />
                            <span className={styles.optionLabel}>{option}</span>
                          </label>
                        ))}
                      </div>
                      {femeiOther ? (
                        <LimitedTextarea
                          className={styles.textarea}
                          name="femeie_menstruatie_descriere"
                          placeholder="Detalii..."
                          style={{ marginTop: "1rem" }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </StepShell>
            </StepPane>

            <StepPane active={currentStep === 3}>
              <StepShell index={4} title="Stare de sanatate">
                <div className={styles.grid}>
                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      1. Va rugam sa enumerati eventualele probleme de sanatate actuale:
                    </label>
                    <LimitedTextarea className={styles.textarea} name="probleme_sanatate" />
                  </div>

                  <div>
                    <label className={styles.label}>Fumati?</label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={fumati === value}
                            name="fumati"
                            onChange={(event) => setFumati(event.target.value)}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {fumati === "Da" ? (
                      <LimitedTextInput
                        className={styles.input}
                        name="fumati_cantitate"
                        placeholder="Cate tigari pe zi?"
                        style={{ marginTop: "1rem" }}
                      />
                    ) : null}
                  </div>

                  <div>
                    <label className={styles.label}>Consumati alcool?</label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={alcool === value}
                            name="alcool"
                            onChange={(event) => setAlcool(event.target.value)}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {alcool === "Da" ? (
                      <LimitedTextInput
                        className={styles.input}
                        name="alcool_cantitate"
                        placeholder="Cate pahare pe zi?"
                        style={{ marginTop: "1rem" }}
                      />
                    ) : null}
                  </div>

                  <div>
                    <label className={styles.label} htmlFor="stress_level">
                      5. Nivel de stres
                    </label>
                    <div className={styles.rangeWrap}>
                      <input defaultValue="3" id="stress_level" max="5" min="1" name="stress_level" type="range" />
                      <div className={styles.rangeLabels}>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={styles.label} htmlFor="readiness_level">
                      6. Nivel de pregatire pentru schimbare
                    </label>
                    <div className={styles.rangeWrap}>
                      <input
                        defaultValue="3"
                        id="readiness_level"
                        max="5"
                        min="1"
                        name="readiness_level"
                        type="range"
                      />
                      <div className={styles.rangeLabels}>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      7. Ce obstacole v-ar putea impiedica sa faceti modificari in stilul de
                      viata?
                    </label>
                    <LimitedTextarea className={styles.textarea} name="obstacole" />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      8. Practici religioase care ar putea influenta dieta sau ingrijirea
                      sanatatii:
                    </label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={practiciReligioase === value}
                            name="practici_religioase_toggle"
                            onChange={(event) => setPracticiReligioase(event.target.value)}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {practiciReligioase === "Da" ? (
                      <LimitedTextarea
                        className={styles.textarea}
                        name="practici_religioase"
                        placeholder="Descrieti practicile religioase relevante pentru alimentatie sau ingrijirea sanatatii."
                        required
                      />
                    ) : null}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      9. In prezent luati vreun medicament?
                    </label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={medicamenteEnabled === (value === "Da")}
                            name="medicamente_radio"
                            onChange={() => {
                              const enabled = value === "Da";
                              setMedicamenteEnabled(enabled);
                              toggleRows(enabled, medicamenteRows, setMedicamenteRows);
                            }}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {medicamenteEnabled ? (
                      <div style={{ marginTop: "1rem" }}>
                        <RepeatableTable
                          addLabel="Adauga rand"
                          columns={[
                            {
                              label: "Nume medicament",
                              name: "medicamente[]",
                              placeholder: "Nume medicament",
                            },
                            {
                              label: "Cantitate",
                              name: "medicamente_cantitate[]",
                              placeholder: "Cantitate",
                            },
                          ]}
                          onAdd={() => setMedicamenteRows((rows) => [...rows, createRow()])}
                          onRemove={(id) =>
                            setMedicamenteRows((rows) => rows.filter((row) => row.id !== id))
                          }
                          rows={medicamenteRows}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      10. In prezent luati vreun supliment alimentar?
                    </label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={suplimenteEnabled === (value === "Da")}
                            name="suplimente_radio"
                            onChange={() => {
                              const enabled = value === "Da";
                              setSuplimenteEnabled(enabled);
                              toggleRows(enabled, suplimenteRows, setSuplimenteRows);
                            }}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {suplimenteEnabled ? (
                      <div style={{ marginTop: "1rem" }}>
                        <RepeatableTable
                          addLabel="Adauga rand"
                          columns={[
                            {
                              label: "Nume supliment",
                              name: "suplimente[]",
                              placeholder: "Nume supliment",
                            },
                            {
                              label: "Cantitate",
                              name: "suplimente_cantitate[]",
                              placeholder: "Cantitate",
                            },
                          ]}
                          onAdd={() => setSuplimenteRows((rows) => [...rows, createRow()])}
                          onRemove={(id) =>
                            setSuplimenteRows((rows) => rows.filter((row) => row.id !== id))
                          }
                          rows={suplimenteRows}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </StepShell>
            </StepPane>

            <StepPane active={currentStep === 4}>
              <StepShell index={5} title="Activitate fizica">
                <div className={styles.grid}>
                  <div className={styles.fieldFull}>
                    <label className={styles.label}>Faceti activitate fizica?</label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={activitateFizica === value}
                            name="activitate_fizica"
                            onChange={(event) => setActivitateFizica(event.target.value)}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {activitateFizica === "Da" ? (
                    <>
                      <div>
                        <label className={styles.label} htmlFor="activitate_frecventa">
                          Cat de des? (zile / saptamana)
                        </label>
                        <LimitedTextInput
                          className={styles.input}
                          id="activitate_frecventa"
                          name="activitate_frecventa"
                          placeholder="Ex: 3 zile / saptamana"
                        />
                      </div>
                      <div>
                        <label className={styles.label} htmlFor="activitate_durata">
                          Durata (minute / zi)
                        </label>
                        <LimitedTextInput
                          className={styles.input}
                          id="activitate_durata"
                          name="activitate_durata"
                          placeholder="Ex: 45 minute / zi"
                        />
                      </div>
                      <div className={styles.fieldFull}>
                        <label className={styles.label} htmlFor="activitate_descriere">
                          In ce consta activitatea fizica?
                        </label>
                        <LimitedTextarea
                          className={styles.textarea}
                          id="activitate_descriere"
                          name="activitate_descriere"
                          placeholder="Ex: mers pe jos, sala, yoga, inot..."
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </StepShell>
            </StepPane>

            <StepPane active={currentStep === 5}>
              <StepShell index={6} title="Informatii nutritionale">
                <div className={styles.grid}>
                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      1. Ce doriti sa schimbati in privinta obiceiurilor alimentare?
                    </label>
                    <LimitedTextarea className={styles.textarea} name="obiective_alimentare" />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      2. Vi s-a schimbat pofta de mancare in ultimele luni?
                    </label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={poftaMancare === value}
                            name="pofta_mancare"
                            onChange={(event) => setPoftaMancare(event.target.value)}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {poftaMancare === "Da" ? (
                      <LimitedTextarea
                        className={styles.textarea}
                        name="pofta_mancare_explicatii"
                        placeholder="Descrieti schimbarile..."
                        style={{ marginTop: "1rem" }}
                      />
                    ) : null}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      3. Suferiti de alergii / intolerante alimentare?
                    </label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={alergiiEnabled === (value === "Da")}
                            name="alergii_toggle"
                            onChange={() => {
                              const enabled = value === "Da";
                              setAlergiiEnabled(enabled);
                              toggleRows(enabled, alergiiRows, setAlergiiRows);
                            }}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {alergiiEnabled ? (
                      <div style={{ marginTop: "1rem" }}>
                        <RepeatableTable
                          addLabel="Adauga rand"
                          columns={[
                            {
                              label: "Alergie / Intoleranta",
                              name: "alergii[]",
                              placeholder: "Alergie / intoleranta",
                            },
                            {
                              label: "Descriere",
                              name: "alergii_descriere[]",
                              placeholder: "Descriere",
                            },
                          ]}
                          onAdd={() => setAlergiiRows((rows) => [...rows, createRow()])}
                          onRemove={(id) =>
                            setAlergiiRows((rows) => rows.filter((row) => row.id !== id))
                          }
                          rows={alergiiRows}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>4. Ati tinut vreodata o dieta?</label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={dieteEnabled === (value === "Da")}
                            name="diete_toggle"
                            onChange={() => {
                              const enabled = value === "Da";
                              setDieteEnabled(enabled);
                              toggleRows(enabled, dieteRows, setDieteRows);
                            }}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {dieteEnabled ? (
                      <div style={{ marginTop: "1rem" }}>
                        <RepeatableTable
                          addLabel="Adauga rand"
                          columns={[
                            {
                              label: "Dieta",
                              name: "diete[]",
                              placeholder: "Numele dietei",
                            },
                            {
                              label: "Descriere",
                              name: "diete_descriere[]",
                              placeholder: "Descriere",
                            },
                          ]}
                          onAdd={() => setDieteRows((rows) => [...rows, createRow()])}
                          onRemove={(id) =>
                            setDieteRows((rows) => rows.filter((row) => row.id !== id))
                          }
                          rows={dieteRows}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      5. Ati folosit laxative, ati postit indelung sau ati facut exercitii
                      excesive pentru a pierde in greutate?
                    </label>
                    <div className={styles.inlineOptions}>
                      {["Da", "Nu"].map((value) => (
                        <label className={styles.radioCard} key={value}>
                          <input
                            checked={laxative === value}
                            name="laxative"
                            onChange={(event) => setLaxative(event.target.value)}
                            type="radio"
                            value={value}
                          />
                          <span className={styles.optionLabel}>{value}</span>
                        </label>
                      ))}
                    </div>
                    {laxative === "Da" ? (
                      <LimitedTextarea
                        className={styles.textarea}
                        name="laxative_explicatii"
                        placeholder="Detaliati..."
                        style={{ marginTop: "1rem" }}
                      />
                    ) : null}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      6. Cat de des mancati in oras / fast-food?
                    </label>
                    <div className={styles.options}>
                      {[
                        ["0-1/luna", "0-1 ori / luna"],
                        ["2-3/luna", "de 2-3 ori / luna"],
                        ["1-2/sapt", "de 1-2 ori / saptamana"],
                        ["3-4/sapt", "3-4 ori / saptamana"],
                        ["5+/sapt", "5+ ori / saptamana"],
                      ].map(([value, label]) => (
                        <label className={styles.option} key={value}>
                          <input name="fastfood_frecventa" type="radio" value={value} />
                          <span className={styles.optionLabel}>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={styles.label} htmlFor="ora_mic_dejun">
                      7. Ora mic dejun
                    </label>
                    <LimitedTextInput className={styles.input} id="ora_mic_dejun" name="ora_mic_dejun" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="ora_pranz">
                      Ora pranz
                    </label>
                    <LimitedTextInput className={styles.input} id="ora_pranz" name="ora_pranz" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="ora_cina">
                      Ora cina
                    </label>
                    <LimitedTextInput className={styles.input} id="ora_cina" name="ora_cina" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="ora_gustari">
                      Ora gustari
                    </label>
                    <LimitedTextInput className={styles.input} id="ora_gustari" name="ora_gustari" />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      8. Fluctuatii majore de greutate in ultimii 5-10 ani
                    </label>
                    <LimitedTextarea className={styles.textarea} name="fluctuatii_greutate" />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      9. Ce credeti ca a declansat cresterea in greutate?
                    </label>
                    <div className={styles.options}>
                      {[
                        "Obiceiuri alimentare",
                        "Ereditatea",
                        "Stresul",
                        "Modificari hormonale",
                        "Plictiseala",
                        "Incetarea fumatului",
                        "Altele",
                      ].map((option) => (
                        <label className={styles.option} key={option}>
                          <input
                            name="declansatori[]"
                            onChange={(event) =>
                              option === "Altele" && setDeclansatoriOther(event.target.checked)
                            }
                            type="checkbox"
                            value={option}
                          />
                          <span className={styles.optionLabel}>{option}</span>
                        </label>
                      ))}
                    </div>
                    {declansatoriOther ? (
                      <LimitedTextarea
                        className={styles.textarea}
                        name="declansatori_altele_text"
                        placeholder="Specificati..."
                        style={{ marginTop: "1rem" }}
                      />
                    ) : null}
                  </div>

                  <div>
                    <label className={styles.label} htmlFor="mese_pe_zi">
                      10. Cate mese mancati pe zi?
                    </label>
                    <NumberStepperInput id="mese_pe_zi" min={0} name="mese_pe_zi" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="mese_descriere">
                      Care sunt mesele?
                    </label>
                    <LimitedTextInput
                      className={styles.input}
                      id="mese_descriere"
                      name="mese_descriere"
                      placeholder="Descrieti mesele"
                    />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      11. Ce alimente aveti tendinta sa consumati mai mult?
                    </label>
                    <RepeatableTable
                      addLabel="Adauga rand"
                      columns={[
                        {
                          label: "Nume aliment",
                          name: "alimenteConsumate[]",
                          placeholder: "Ex: Paste, dulciuri, paine etc.",
                        },
                      ]}
                      onAdd={() => setAlimenteConsumateRows((rows) => [...rows, createRow()])}
                      onRemove={(id) =>
                        setAlimenteConsumateRows((rows) => rows.filter((row) => row.id !== id))
                      }
                      rows={alimenteConsumateRows}
                    />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      12. Ce tip de paine consumati si in ce cantitate?
                    </label>
                    <LimitedTextarea className={styles.textarea} name="paine" />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      13. Ce tipuri de grasimi si uleiuri folositi?
                    </label>
                    <div className={styles.options}>
                      {grasimiOptions.map((option) => (
                        <label className={styles.option} key={option}>
                          <input name="grasimi[]" type="checkbox" value={option} />
                          <span className={styles.optionLabel}>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      14. Ce bauturi consumati regulat?
                    </label>
                    <div className={styles.options}>
                      {bauturiOptions.map((option) => (
                        <label className={styles.option} key={option}>
                          <input
                            name="bauturi[]"
                            onChange={(event) =>
                              option === "Altele" && setBauturiOther(event.target.checked)
                            }
                            type="checkbox"
                            value={option}
                          />
                          <span className={styles.optionLabel}>{option}</span>
                        </label>
                      ))}
                    </div>
                    {bauturiOther ? (
                      <LimitedTextarea
                        className={styles.textarea}
                        name="bauturi_altele_text"
                        placeholder="Specificati..."
                        style={{ marginTop: "1rem" }}
                      />
                    ) : null}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      15. Cat de des consumati alcool (1-2 pahare la o masa)?
                    </label>
                    <div className={styles.options}>
                      {[
                        ["Niciodata", "Niciodata"],
                        ["2-3/luna", "de 2-3 ori / luna"],
                        ["1-2/sapt", "de 1-2 ori / saptamana"],
                        ["3-4/sapt", "3-4 ori / saptamana"],
                        ["zilnic", "Zilnic"],
                      ].map(([value, label]) => (
                        <label className={styles.option} key={value}>
                          <input name="alcool_frecventa" type="radio" value={value} />
                          <span className={styles.optionLabel}>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      16. Aveti pofte alimentare pentru urmatoarele?
                    </label>
                    <div className={styles.options}>
                      {pofteOptions.map((option) => (
                        <label className={styles.option} key={option}>
                          <input
                            name="pofte[]"
                            onChange={(event) =>
                              option === "Altele" && setPofteOther(event.target.checked)
                            }
                            type="checkbox"
                            value={option}
                          />
                          <span className={styles.optionLabel}>
                            {option === "Paine"
                              ? "Paine / patiserie"
                              : option === "Mezeluri"
                                ? "Carne procesata / mezeluri"
                                : option === "Snacksuri"
                                  ? "Snacks-uri / chipsuri"
                                  : option}
                          </span>
                        </label>
                      ))}
                    </div>
                    {pofteOther ? (
                      <LimitedTextarea
                        className={styles.textarea}
                        name="pofte_altele_text"
                        placeholder="Specificati..."
                        style={{ marginTop: "1rem" }}
                      />
                    ) : null}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>17. Alimente care va displac</label>
                    <RepeatableTable
                      addLabel="Adauga aliment"
                      columns={[
                        {
                          label: "Aliment",
                          name: "displaceri[]",
                          placeholder: "Ex: Broccoli",
                        },
                      ]}
                      onAdd={() => setDisplaceriRows((rows) => [...rows, createRow()])}
                      onRemove={(id) =>
                        setDisplaceriRows((rows) => rows.filter((row) => row.id !== id))
                      }
                      rows={displaceriRows}
                    />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      18. Alimente si bauturi consumate in ultimele 2 zile
                    </label>
                    <RepeatableTable
                      addLabel="Adauga rand"
                      columns={[
                        { label: "Ziua", name: "alimentatie_zi[]", placeholder: "Ziua" },
                        { label: "Produs", name: "alimentatie_produs[]", placeholder: "Produs" },
                        {
                          label: "Cantitate",
                          name: "alimentatie_cantitate[]",
                          placeholder: "Cantitate",
                        },
                        { label: "Ora", name: "alimentatie_ora[]", placeholder: "Ora" },
                      ]}
                      onAdd={() => setAlimentatieRows((rows) => [...rows, createRow()])}
                      onRemove={(id) =>
                        setAlimentatieRows((rows) => rows.filter((row) => row.id !== id))
                      }
                      rows={alimentatieRows}
                    />
                  </div>
                </div>
              </StepShell>
            </StepPane>

            {submitState.message ? (
              <div
                className={`${styles.alert} ${
                  submitState.type === "error" ? styles.alertError : styles.alertSuccess
                }`}
              >
                {submitState.message}
              </div>
            ) : null}

            <div className={styles.footer}>
              <p className={styles.footerNote}>
                Datele sunt salvate direct pe programarea ta si folosite doar pentru pregatirea
                consultatiei.
              </p>

              <div className={styles.footerActions}>
                <button
                  className={`${styles.backButton}${currentStep === 0 ? ` ${styles.disabled}` : ""}`}
                  disabled={currentStep === 0 || submitState.type === "loading"}
                  onClick={(event) =>
                    handleStepNavigation(event, Math.max(0, currentStep - 1))
                  }
                  type="button"
                >
                  Inapoi
                </button>
                {currentStep < steps.length - 1 ? (
                  <button
                    className={styles.nextButton}
                    key="questionnaire-next"
                    onClick={(event) =>
                      handleStepNavigation(event, Math.min(steps.length - 1, currentStep + 1))
                    }
                    type="button"
                  >
                    Sectiunea urmatoare
                  </button>
                ) : (
                  <button
                    className={`${styles.nextButton} ${styles.submitButton}`}
                    disabled={submitState.type === "loading"}
                    key="questionnaire-submit"
                    type="submit"
                  >
                    {submitState.type === "loading" ? "Se trimite..." : "Trimite chestionarul"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.mobileNav}>
            {steps.map((step, index) => (
              <button
                key={step.key}
                className={`${styles.mobileNavButton}${
                  index === currentStep ? ` ${styles.mobileNavButtonActive}` : ""
                }`}
                onClick={(event) => handleStepNavigation(event, index)}
                type="button"
              >
                {index + 1}. {step.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
