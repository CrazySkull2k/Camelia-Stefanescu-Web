import { format, isValid, parseISO } from "date-fns";

const bucharestFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Bucharest",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getFormatterParts(date: Date) {
  return bucharestFormatter
    .formatToParts(date)
    .reduce<Record<string, string>>((accumulator, part) => {
      if (part.type !== "literal") {
        accumulator[part.type] = part.value;
      }

      return accumulator;
    }, {});
}

function getBucharestOffsetMs(date: Date) {
  const parts = getFormatterParts(date);

  const utcTimestamp = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return utcTimestamp - date.getTime();
}

function formatDateParts(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function fromBucharestDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const firstOffset = getBucharestOffsetMs(utcGuess);
  const adjustedDate = new Date(utcGuess.getTime() - firstOffset);
  const secondOffset = getBucharestOffsetMs(adjustedDate);

  if (secondOffset === firstOffset) {
    return adjustedDate;
  }

  return new Date(utcGuess.getTime() - secondOffset);
}

export function getBucharestDayBounds(dateValue: string) {
  const start = fromBucharestDateTime(dateValue, "00:00");
  const [year, month, day] = dateValue.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

  return {
    start,
    end: fromBucharestDateTime(formatDateParts(nextDay), "00:00"),
  };
}

export function formatDateTime(
  value: string | Date,
  fallback = "Data indisponibila",
) {
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? format(date, "dd.MM.yyyy HH:mm") : fallback;
}

export function formatDate(value: string | Date, fallback = "Data indisponibila") {
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? format(date, "dd.MM.yyyy") : fallback;
}

export function formatDateInputValue(value: string | Date, fallback = "") {
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? format(date, "yyyy-MM-dd") : fallback;
}

export function formatTimeInputValue(value: string | Date, fallback = "") {
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? format(date, "HH:mm") : fallback;
}
