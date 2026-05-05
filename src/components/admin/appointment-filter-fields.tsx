"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "./appointment-filter-fields.module.css";

type FilterOption = {
  disabled?: boolean;
  helper?: string;
  label: string;
  value: string;
};

type CalendarDay = {
  currentMonth: boolean;
  dayOfMonth: number;
  value: string;
};

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

function buildCalendarDays(visibleMonth: Date): CalendarDay[] {
  const firstDayOfMonth = startOfMonth(visibleMonth);
  const offset = (firstDayOfMonth.getDay() + 6) % 7;
  const firstVisibleDay = new Date(firstDayOfMonth);
  firstVisibleDay.setDate(firstDayOfMonth.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(firstVisibleDay);
    current.setDate(firstVisibleDay.getDate() + index);
    const normalized = new Date(current.getFullYear(), current.getMonth(), current.getDate());

    return {
      currentMonth: isSameMonth(normalized, visibleMonth),
      dayOfMonth: normalized.getDate(),
      value: toDateValue(normalized),
    };
  });
}

function formatDisplayDate(value: string) {
  const date = parseDateValue(value);

  if (!date) {
    return "Alege data";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(".", "");
}

function SelectChevronIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 20 20" width="18">
      <path
        d="M5.5 7.75L10 12.25L14.5 7.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 20 20" width="18">
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

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="M12.5 5L7.5 10L12.5 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function AppointmentFilterSelect({
  allowEmpty = true,
  defaultValue,
  label,
  name,
  onValueChange,
  options,
  placeholder,
}: {
  allowEmpty?: boolean;
  defaultValue: string;
  label: string;
  name: string;
  onValueChange?: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
}) {
  const id = useId();
  const [currentValue, setCurrentValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const allOptions = allowEmpty ? [{ label: placeholder, value: "" }, ...options] : options;
  const selectedOption = allOptions.find((option) => option.value === currentValue);

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

  return (
    <div className={styles.selectWrap} ref={containerRef}>
      <span className={styles.srOnly}>{label}</span>
      <input name={name} readOnly type="hidden" value={currentValue} />
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={`${styles.selectButton}${open ? ` ${styles.selectButtonOpen}` : ""}`}
        id={id}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span
          className={`${styles.selectValue}${currentValue ? "" : ` ${styles.placeholder}`}`}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <span className={styles.selectIcon}>
          <SelectChevronIcon />
        </span>
      </button>

      {open ? (
        <div aria-labelledby={id} className={styles.selectMenu} role="listbox">
          {allOptions.map((option) => {
            const isSelected = option.value === currentValue;
            const isDisabled = Boolean(option.disabled);

            return (
              <button
                aria-selected={isSelected}
                disabled={isDisabled}
                className={`${styles.selectOption}${
                  isSelected ? ` ${styles.selectOptionSelected}` : ""
                }${isDisabled ? ` ${styles.selectOptionDisabled}` : ""}`}
                key={`${name}-${option.value || "empty"}`}
                onClick={() => {
                  if (isDisabled) {
                    return;
                  }

                  setCurrentValue(option.value);
                  onValueChange?.(option.value);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className={styles.selectOptionText}>
                  <span className={styles.selectOptionLabel}>{option.label}</span>
                  {option.helper ? (
                    <span className={styles.selectOptionHelper}>{option.helper}</span>
                  ) : null}
                </span>
                <span className={styles.selectOptionCheck} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AppointmentDateFilter({
  allowClear = true,
  defaultValue,
  label,
  name,
  onValueChange,
}: {
  allowClear?: boolean;
  defaultValue: string;
  label: string;
  name: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const parsed = parseDateValue(defaultValue);
    return startOfMonth(parsed ?? new Date());
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parseDateValue(value);
  const days = buildCalendarDays(visibleMonth);

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
    setValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);

    const parsed = parseDateValue(nextValue);
    if (parsed) {
      setVisibleMonth(startOfMonth(parsed));
    }
  }

  return (
    <div className={styles.dateWrap} ref={containerRef}>
      <label className={styles.label} htmlFor={`${name}-button`}>
        {label}
      </label>
      <input name={name} readOnly type="hidden" value={value} />
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        className={`${styles.dateButton}${open ? ` ${styles.dateButtonOpen}` : ""}`}
        id={`${name}-button`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className={`${styles.dateValue}${value ? "" : ` ${styles.placeholder}`}`}>
          {formatDisplayDate(value)}
        </span>
        <span className={styles.dateIcon}>
          <CalendarIcon />
        </span>
      </button>

      {open ? (
        <div aria-label={`Alege data pentru ${label}`} className={styles.datePopover} role="dialog">
          <div className={styles.datePopoverHeader}>
            <span className={styles.datePopoverTitle}>
              {monthLabels[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </span>
            <div className={styles.datePopoverControls}>
              <button
                aria-label="Luna anterioara"
                className={styles.datePopoverControl}
                onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                type="button"
              >
                <ChevronLeftIcon />
              </button>
              <button
                aria-label="Luna urmatoare"
                className={styles.datePopoverControl}
                onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                type="button"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className={styles.dateWeekdays}>
            {weekdayLabels.map((weekday) => (
              <span className={styles.dateWeekday} key={weekday}>
                {weekday}
              </span>
            ))}
          </div>

          <div className={styles.dateGrid}>
            {days.map((day) => {
              const isSelected = day.value === value;
              const isToday = day.value === toDateValue(new Date());

              return (
                <button
                  className={[
                    styles.dateDay,
                    !day.currentMonth ? styles.dateDayMuted : "",
                    isToday ? styles.dateDayToday : "",
                    isSelected ? styles.dateDaySelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={day.value}
                  onClick={() => handleSelect(day.value)}
                  type="button"
                >
                  {day.dayOfMonth}
                </button>
              );
            })}
          </div>

          <div className={styles.datePopoverFooter}>
            {allowClear ? (
              <button
                className={styles.datePopoverAction}
                disabled={!value}
                onClick={() => {
                  setValue("");
                  onValueChange?.("");
                  setOpen(false);
                }}
                type="button"
              >
                Sterge
              </button>
            ) : (
              <span />
            )}
            <button
              className={styles.datePopoverAction}
              onClick={() => handleSelect(toDateValue(new Date()))}
              type="button"
            >
              Astazi
            </button>
          </div>

          {selectedDate ? (
            <p className={styles.dateHelper}>Selectata: {formatDisplayDate(value)}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
