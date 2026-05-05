export type ClinicWeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ClinicWorkingDay = {
  enabled: boolean;
  end: string;
  start: string;
};

export type ClinicAppointmentSchedule = Record<ClinicWeekdayKey, ClinicWorkingDay>;

export const clinicWeekdays: Array<{ key: ClinicWeekdayKey; label: string }> = [
  { key: "monday", label: "Luni" },
  { key: "tuesday", label: "Marti" },
  { key: "wednesday", label: "Miercuri" },
  { key: "thursday", label: "Joi" },
  { key: "friday", label: "Vineri" },
  { key: "saturday", label: "Sambata" },
  { key: "sunday", label: "Duminica" },
];

export const defaultAppointmentSchedule: ClinicAppointmentSchedule = {
  monday: { enabled: true, start: "11:00", end: "20:00" },
  tuesday: { enabled: true, start: "11:00", end: "20:00" },
  wednesday: { enabled: true, start: "11:00", end: "20:00" },
  thursday: { enabled: true, start: "11:00", end: "20:00" },
  friday: { enabled: true, start: "11:00", end: "20:00" },
  saturday: { enabled: false, start: "11:00", end: "15:00" },
  sunday: { enabled: false, start: "11:00", end: "15:00" },
};

const weekdayByJsDay: ClinicWeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const bucharestPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Bucharest",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getBucharestParts(value: Date) {
  return bucharestPartsFormatter
    .formatToParts(value)
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== "literal") {
        parts[part.type] = part.value;
      }

      return parts;
    }, {});
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  const normalized = Math.max(0, Math.min(value, 24 * 60));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isHalfHourTime(value: string) {
  const minutes = timeToMinutes(value);
  return minutes !== null && minutes % 30 === 0;
}

function normalizeWorkingDay(
  value: unknown,
  fallback: ClinicWorkingDay,
): ClinicWorkingDay {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const maybeDay = value as Partial<ClinicWorkingDay>;
  const start =
    typeof maybeDay.start === "string" && isHalfHourTime(maybeDay.start)
      ? maybeDay.start
      : fallback.start;
  const end =
    typeof maybeDay.end === "string" && isHalfHourTime(maybeDay.end)
      ? maybeDay.end
      : fallback.end;
  const startMinutes = timeToMinutes(start) ?? 0;
  const endMinutes = timeToMinutes(end) ?? 0;

  return {
    enabled: Boolean(maybeDay.enabled) && endMinutes > startMinutes,
    start,
    end,
  };
}

export function normalizeClinicSchedule(input: unknown): ClinicAppointmentSchedule {
  const source = input && typeof input === "object" ? input : {};

  return clinicWeekdays.reduce<ClinicAppointmentSchedule>((schedule, weekday) => {
    schedule[weekday.key] = normalizeWorkingDay(
      (source as Partial<Record<ClinicWeekdayKey, unknown>>)[weekday.key],
      defaultAppointmentSchedule[weekday.key],
    );
    return schedule;
  }, {} as ClinicAppointmentSchedule);
}

export function getBucharestDateValue(value: Date) {
  const parts = getBucharestParts(value);

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getBucharestTimeValue(value: Date) {
  const parts = getBucharestParts(value);

  return `${parts.hour}:${parts.minute}`;
}

export function getBucharestTimeMinutes(value: Date) {
  return timeToMinutes(getBucharestTimeValue(value));
}

export function getWeekdayKeyForDate(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00+03:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return weekdayByJsDay[date.getUTCDay()] ?? null;
}

export function getWorkingWindowForDate(
  dateValue: string,
  schedule: ClinicAppointmentSchedule,
) {
  const weekdayKey = getWeekdayKeyForDate(dateValue);

  if (!weekdayKey) {
    return null;
  }

  const day = schedule[weekdayKey];
  const startMinutes = timeToMinutes(day.start);
  const endMinutes = timeToMinutes(day.end);

  if (!day.enabled || startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return {
    end: day.end,
    endMinutes,
    start: day.start,
    startMinutes,
    weekdayKey,
  };
}

export function buildHalfHourTimeOptions(input: {
  endMinutes: number;
  includeEnd?: boolean;
  startMinutes: number;
}) {
  const options: Array<{ label: string; value: string }> = [];
  const last = input.includeEnd ? input.endMinutes : input.endMinutes - 30;

  for (let minutes = input.startMinutes; minutes <= last; minutes += 30) {
    const value = minutesToTime(minutes);
    options.push({ label: value, value });
  }

  return options;
}
