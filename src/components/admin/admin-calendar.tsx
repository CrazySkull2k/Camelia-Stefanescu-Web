"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Info,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Stethoscope,
  UserRound,
} from "lucide-react";
import clsx from "clsx";

import {
  AppointmentDateFilter,
  AppointmentFilterSelect,
} from "@/components/admin/appointment-filter-fields";
import {
  MorphEventsCalendar,
  type MorphCalendarEvent,
} from "@/components/shared/morph-events-calendar";
import {
  buildHalfHourTimeOptions,
  getWorkingWindowForDate,
  minutesToTime,
  timeToMinutes,
  type ClinicAppointmentSchedule,
} from "@/modules/settings/schedule";
import type {
  AppointmentIntakeStatus,
  AppointmentSource,
  AppointmentSyncStatus,
} from "@/modules/appointments/types";

import styles from "./admin-calendar.module.css";

type AppointmentStatus = "cancelled" | "completed" | "confirmed" | "pending";
type CalendarBlockType = "admin" | "clinic_work" | "personal" | "unavailable";
type CalendarBlockColor = "cream" | "peach" | "sage" | "stone";
type AdminCalendarPanel = "appointment" | "block" | "day";
type CalendarBlockTimeMode = "all_day" | "custom";

type AppointmentCalendarEvent = {
  adminNotes: string | null;
  appointmentHref: string;
  contact: string | null;
  email: string | null;
  endAt: string;
  href: string;
  id: string;
  intakeStatus: AppointmentIntakeStatus;
  isFirstVisit: boolean;
  kind: "appointment";
  patientId: string | null;
  patientName: string;
  patientProfileHref: string | null;
  phone: string | null;
  referenceHint: string | null;
  serviceName: string;
  source: AppointmentSource | null;
  startAt: string;
  status: AppointmentStatus;
  syncStatus: AppointmentSyncStatus;
  title: string;
};

type BlockCalendarEvent = {
  blockType: CalendarBlockType;
  color: CalendarBlockColor;
  description: string | null;
  endAt: string;
  id: string;
  kind: "block";
  startAt: string;
  title: string;
};

type ExternalAppointmentCalendarEvent = {
  description: string | null;
  endAt: string;
  googleCalendarHref: string | null;
  googleEventId: string;
  id: string;
  kind: "external_appointment";
  location: string | null;
  startAt: string;
  title: string;
};

type AdminCalendarEvent =
  | AppointmentCalendarEvent
  | BlockCalendarEvent
  | ExternalAppointmentCalendarEvent;
type AdminCalendarMorphEvent = AdminCalendarEvent & MorphCalendarEvent;

type AdminCalendarProps = {
  appointmentSchedule: ClinicAppointmentSchedule;
  events: AdminCalendarEvent[];
  loadedFrom: string;
  loadedTo: string;
  nonce?: string | null;
};

type CalendarBlockSubmitState = {
  message: string;
  status: "error" | "idle" | "success";
};

const blockTypeLabels: Record<CalendarBlockType, string> = {
  admin: "Administrativ",
  clinic_work: "Program cabinet",
  personal: "Personal",
  unavailable: "Indisponibil",
};

const blockColorLabels: Record<CalendarBlockColor, string> = {
  cream: "Crem",
  peach: "Peach",
  sage: "Sage",
  stone: "Stone",
};

const tabLabels: Array<{ label: string; value: AdminCalendarPanel }> = [
  { label: "Zi selectata", value: "day" },
  { label: "Adauga bloc", value: "block" },
  { label: "Programare", value: "appointment" },
];

const blockTypeOptions = Object.entries(blockTypeLabels).map(([value, label]) => ({
  label,
  value,
}));

const blockColorOptions = Object.entries(blockColorLabels).map(([value, label]) => ({
  label,
  value,
}));

const initialBlockSubmitState: CalendarBlockSubmitState = {
  message: "",
  status: "idle",
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  });
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "long",
    timeZone: "Europe/Bucharest",
    weekday: "long",
    year: "numeric",
  }).format(value instanceof Date ? value : new Date(value));
}

function formatDateKey(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Bucharest",
    weekday: "short",
  })
    .format(new Date(`${value}T12:00:00+03:00`))
    .replace(".", "");
}

function statusLabel(status: AppointmentStatus) {
  if (status === "confirmed") return "Confirmata";
  if (status === "completed") return "Finalizata";
  if (status === "cancelled") return "Anulata";
  return "In asteptare";
}

function statusTone(status: AppointmentStatus) {
  if (status === "confirmed") return "bg-[#edf6ee] text-[#3f6a4b]";
  if (status === "completed") return "bg-[#efeee6] text-[#5e6058]";
  if (status === "cancelled") return "bg-[#fff3f2] text-[#94494a]";
  return "bg-[#fff3e6] text-[#7a5a35]";
}

function intakeLabel(status: AppointmentIntakeStatus) {
  if (status === "submitted") return "Trimisa";
  if (status === "required_pending") return "In asteptare";
  return "Nu este necesara";
}

function intakeTone(status: AppointmentIntakeStatus) {
  if (status === "submitted") return "bg-[#edf6ee] text-[#3f6a4b]";
  if (status === "required_pending") return "bg-[#fff3e6] text-[#7a5a35]";
  return "bg-[#efeee6] text-[#5e6058]";
}

function syncLabel(status: AppointmentSyncStatus) {
  if (status === "synced") return "Sincronizat";
  if (status === "pending") return "In asteptare";
  if (status === "needs_retry") return "Necesita retry";
  return "Eroare";
}

function syncTone(status: AppointmentSyncStatus) {
  if (status === "synced") return "bg-[#edf6ee] text-[#3f6a4b]";
  if (status === "pending") return "bg-[#fff3e6] text-[#7a5a35]";
  return "bg-[#fff3f2] text-[#94494a]";
}

function sourceLabel(source: AppointmentSource | null) {
  if (source === "admin_panel") return "Admin";
  if (source === "patient_account") return "Cont pacient";
  if (source === "public_site") return "Site public";
  return "Sursa necunoscuta";
}

function blockTone(color: CalendarBlockColor) {
  if (color === "sage") return "border-[#cfe3d1] bg-[#edf6ee] text-[#3f6a4b]";
  if (color === "stone") return "border-[#d9dbcf] bg-[#efeee6] text-[#31332c]";
  if (color === "cream") return "border-[#e8e9e0] bg-[#fbf9f4] text-[#5e6058]";
  return "border-[#ffdcbd] bg-[#fff3e6] text-[#654d35]";
}

function getDefaultEndTime(startTime: string, dateKey: string, schedule: ClinicAppointmentSchedule) {
  const [hours = 9, minutes = 0] = startTime.split(":").map(Number);
  const date = new Date(2026, 0, 1, hours, minutes);
  date.setMinutes(date.getMinutes() + 60);
  const workingWindow = getWorkingWindowForDate(dateKey, schedule);
  const endMinutes = timeToMinutes(
    date.toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
    }),
  );

  if (workingWindow && endMinutes !== null && endMinutes > workingWindow.endMinutes) {
    return workingWindow.end;
  }

  return date.toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
}

function getTimeInputValue(value: string) {
  return new Date(value).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  });
}

function eventDayPillClassName(event: AdminCalendarEvent) {
  if (event.kind === "external_appointment") {
    return "!bg-[#e8e9e0] !text-[#525151]";
  }

  if (event.kind === "block") {
    if (event.color === "sage") return "!bg-[#edf6ee] !text-[#3f6a4b]";
    if (event.color === "stone") return "!bg-[#e2e3d9] !text-[#31332c]";
    return "!bg-[#fff3e6] !text-[#654d35]";
  }

  if (event.status === "cancelled") return "!bg-[#fff3f2] !text-[#94494a]";
  if (event.status === "confirmed") return "!bg-[#edf6ee] !text-[#3f6a4b]";
  return undefined;
}

function toDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Bucharest",
    year: "numeric",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((accumulator, part) => {
      if (part.type !== "literal") {
        accumulator[part.type] = part.value;
      }

      return accumulator;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getBlockingRangesForDate(
  events: AdminCalendarEvent[],
  dateKey: string,
  editingBlockId?: string | null,
) {
  return events
    .filter((event) => {
      if (toDateKey(event.startAt) !== dateKey) {
        return false;
      }

      if (event.kind === "appointment") {
        return event.status !== "cancelled";
      }

      if (event.kind === "external_appointment") {
        return true;
      }

      return event.id !== editingBlockId;
    })
    .map((event) => ({
      end: timeToMinutes(getTimeInputValue(event.endAt)),
      start: timeToMinutes(getTimeInputValue(event.startAt)),
    }))
    .filter(
      (range): range is { end: number; start: number } =>
        range.start !== null && range.end !== null && range.end > range.start,
    );
}

function getCommonWorkingWindow(
  dateKeys: string[],
  schedule: ClinicAppointmentSchedule,
) {
  const windows = dateKeys.map((dateKey) =>
    getWorkingWindowForDate(dateKey, schedule),
  );

  if (!windows.length || windows.some((window) => !window)) {
    return null;
  }

  const startMinutes = Math.max(
    ...windows.map((window) => window?.startMinutes ?? 0),
  );
  const endMinutes = Math.min(
    ...windows.map((window) => window?.endMinutes ?? 0),
  );

  if (endMinutes <= startMinutes) {
    return null;
  }

  return {
    end: minutesToTime(endMinutes),
    endMinutes,
    start: minutesToTime(startMinutes),
    startMinutes,
  };
}

function sortDateKeys(dateKeys: string[]) {
  return Array.from(new Set(dateKeys)).sort((left, right) =>
    left.localeCompare(right),
  );
}

function hasRangeOverlap(
  startMinutes: number,
  endMinutes: number,
  ranges: Array<{ end: number; start: number }>,
) {
  return ranges.some((range) => startMinutes < range.end && endMinutes > range.start);
}

function getFirstAvailableRange(input: {
  dateKey: string;
  durationMinutes?: number;
  editingBlockId?: string | null;
  events: AdminCalendarEvent[];
  schedule: ClinicAppointmentSchedule;
}) {
  const durationMinutes = input.durationMinutes ?? 60;
  const workingWindow = getWorkingWindowForDate(input.dateKey, input.schedule);

  if (!workingWindow) {
    return { end: "10:00", start: "09:00" };
  }

  const ranges = getBlockingRangesForDate(
    input.events,
    input.dateKey,
    input.editingBlockId,
  );

  for (
    let startMinutes = workingWindow.startMinutes;
    startMinutes + durationMinutes <= workingWindow.endMinutes;
    startMinutes += 30
  ) {
    const endMinutes = startMinutes + durationMinutes;

    if (!hasRangeOverlap(startMinutes, endMinutes, ranges)) {
      return {
        end: minutesToTime(endMinutes),
        start: minutesToTime(startMinutes),
      };
    }
  }

  return {
    end: workingWindow.end,
    start: workingWindow.start,
  };
}

function getFirstAvailableEndTime(input: {
  dateKey: string;
  editingBlockId?: string | null;
  events: AdminCalendarEvent[];
  schedule: ClinicAppointmentSchedule;
  startTime: string;
}) {
  const workingWindow = getWorkingWindowForDate(input.dateKey, input.schedule);
  const startMinutes = timeToMinutes(input.startTime);

  if (!workingWindow || startMinutes === null) {
    return getDefaultEndTime(input.startTime, input.dateKey, input.schedule);
  }

  const ranges = getBlockingRangesForDate(
    input.events,
    input.dateKey,
    input.editingBlockId,
  );

  for (
    let endMinutes = Math.max(startMinutes + 30, workingWindow.startMinutes + 30);
    endMinutes <= workingWindow.endMinutes;
    endMinutes += 30
  ) {
    if (!hasRangeOverlap(startMinutes, endMinutes, ranges)) {
      return minutesToTime(endMinutes);
    }
  }

  return getDefaultEndTime(input.startTime, input.dateKey, input.schedule);
}

export function AdminCalendar({
  appointmentSchedule,
  events,
  loadedFrom,
  loadedTo,
  nonce,
}: AdminCalendarProps) {
  const router = useRouter();
  const todayKey = toDateKey(new Date());
  const [activePanel, setActivePanel] = useState<AdminCalendarPanel>("day");
  const [editingBlock, setEditingBlock] = useState<BlockCalendarEvent | null>(null);
  const [draftDate, setDraftDate] = useState(todayKey);
  const [requestedCalendarDateKey, setRequestedCalendarDateKey] =
    useState<string | null>(todayKey);
  const [selectedBlockDates, setSelectedBlockDates] = useState<string[]>([todayKey]);
  const [hasManualBlockDateSelection, setHasManualBlockDateSelection] =
    useState(false);
  const [draftStartTime, setDraftStartTime] = useState("09:00");
  const [draftEndTime, setDraftEndTime] = useState("10:00");
  const [draftTimeMode, setDraftTimeMode] =
    useState<CalendarBlockTimeMode>("all_day");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftType, setDraftType] = useState<CalendarBlockType>("unavailable");
  const [draftColor, setDraftColor] = useState<CalendarBlockColor>("peach");
  const [activeCalendarEventId, setActiveCalendarEventId] = useState<string | null>(
    null,
  );
  const [blockSubmitState, setBlockSubmitState] = useState<CalendarBlockSubmitState>(
    initialBlockSubmitState,
  );
  const [isSavingBlock, setIsSavingBlock] = useState(false);

  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        dayPillClassName: eventDayPillClassName(event),
        morphPillClassName: eventDayPillClassName(event),
      })) satisfies AdminCalendarMorphEvent[],
    [events],
  );

  const appointmentCount = events.filter((event) => event.kind === "appointment").length;
  const externalAppointmentCount = events.filter(
    (event) => event.kind === "external_appointment",
  ).length;
  const blockCount = events.filter((event) => event.kind === "block").length;
  const draftStartMinutes = timeToMinutes(draftStartTime);
  const draftEndMinutes = timeToMinutes(draftEndTime);
  const draftDurationMinutes =
    draftStartMinutes !== null && draftEndMinutes !== null && draftEndMinutes > draftStartMinutes
      ? draftEndMinutes - draftStartMinutes
      : 60;
  const blockDateKeys = useMemo(
    () => (editingBlock ? [draftDate] : selectedBlockDates),
    [draftDate, editingBlock, selectedBlockDates],
  );
  const workingWindow = getCommonWorkingWindow(blockDateKeys, appointmentSchedule);
  const blockingRanges = useMemo(
    () =>
      blockDateKeys.flatMap((dateKey) =>
        getBlockingRangesForDate(events, dateKey, editingBlock?.id ?? null),
      ),
    [blockDateKeys, editingBlock?.id, events],
  );
  const allDayBlockInvalid = useMemo(
    () =>
      !blockDateKeys.length ||
      blockDateKeys.some((dateKey) => {
        const dateWorkingWindow = getWorkingWindowForDate(
          dateKey,
          appointmentSchedule,
        );

        if (!dateWorkingWindow) {
          return true;
        }

        return hasRangeOverlap(
          dateWorkingWindow.startMinutes,
          dateWorkingWindow.endMinutes,
          getBlockingRangesForDate(events, dateKey, editingBlock?.id ?? null),
        );
      }),
    [appointmentSchedule, blockDateKeys, editingBlock?.id, events],
  );
  const startTimeOptions = useMemo(() => {
    if (!workingWindow) {
      return [];
    }

    return buildHalfHourTimeOptions({
      startMinutes: workingWindow.startMinutes,
      endMinutes: workingWindow.endMinutes - 30,
      includeEnd: true,
    }).map((option) => {
      const startMinutes = timeToMinutes(option.value) ?? workingWindow.startMinutes;
      const endMinutes = Math.min(
        startMinutes + Math.max(draftDurationMinutes, 30),
        workingWindow.endMinutes,
      );
      const disabled =
        endMinutes <= startMinutes ||
        hasRangeOverlap(startMinutes, endMinutes, blockingRanges);

      return {
        ...option,
        disabled,
        helper: disabled ? "Ocupat" : undefined,
      };
    });
  }, [blockingRanges, draftDurationMinutes, workingWindow]);
  const endTimeOptions = useMemo(() => {
    if (!workingWindow || draftStartMinutes === null) {
      return [];
    }

    return buildHalfHourTimeOptions({
      startMinutes: Math.max(workingWindow.startMinutes, draftStartMinutes + 30),
      endMinutes: workingWindow.endMinutes,
      includeEnd: true,
    }).map((option) => {
      const endMinutes = timeToMinutes(option.value) ?? workingWindow.endMinutes;
      const disabled =
        endMinutes <= draftStartMinutes ||
        hasRangeOverlap(draftStartMinutes, endMinutes, blockingRanges);

      return {
        ...option,
        disabled,
        helper: disabled ? "Se suprapune" : undefined,
      };
    });
  }, [blockingRanges, draftStartMinutes, workingWindow]);
  const customBlockRangeInvalid =
    !workingWindow ||
    draftStartMinutes === null ||
    draftEndMinutes === null ||
    draftEndMinutes <= draftStartMinutes ||
    blockDateKeys.length === 0 ||
    draftStartMinutes < workingWindow.startMinutes ||
    draftEndMinutes > workingWindow.endMinutes ||
    hasRangeOverlap(draftStartMinutes, draftEndMinutes, blockingRanges);
  const selectedBlockRangeInvalid =
    draftTimeMode === "all_day" ? allDayBlockInvalid : customBlockRangeInvalid;

  function clearBlockSubmitState() {
    setBlockSubmitState(initialBlockSubmitState);
  }

  function beginNewBlock(dateKey = draftDate) {
    const nextRange = getFirstAvailableRange({
      dateKey,
      events,
      schedule: appointmentSchedule,
    });

    setEditingBlock(null);
    setDraftDate(dateKey);
    setSelectedBlockDates([dateKey]);
    setHasManualBlockDateSelection(false);
    setDraftStartTime(nextRange.start);
    setDraftEndTime(nextRange.end);
    setDraftTimeMode("all_day");
    setDraftTitle("");
    setDraftDescription("");
    setDraftType("unavailable");
    setDraftColor("peach");
    clearBlockSubmitState();
    setRequestedCalendarDateKey(null);
    setActivePanel("block");
  }

  function beginEditBlock(block: BlockCalendarEvent) {
    const blockDateKey = toDateKey(block.startAt);
    setEditingBlock(block);
    setDraftDate(blockDateKey);
    setSelectedBlockDates([blockDateKey]);
    setHasManualBlockDateSelection(false);
    setDraftStartTime(getTimeInputValue(block.startAt));
    setDraftEndTime(getTimeInputValue(block.endAt));
    setDraftTimeMode("custom");
    setDraftTitle(block.title);
    setDraftDescription(block.description ?? "");
    setDraftType(block.blockType);
    setDraftColor(block.color);
    clearBlockSubmitState();
    setRequestedCalendarDateKey(blockDateKey);
    setActivePanel("block");
  }

  function handleSelectedDateChange(dateKey: string | null) {
    if (!dateKey) {
      return;
    }

    if (!editingBlock) {
      setDraftDate(dateKey);
      setSelectedBlockDates([dateKey]);
      setHasManualBlockDateSelection(false);
      setRequestedCalendarDateKey(dateKey);
      const nextRange = getFirstAvailableRange({
        dateKey,
        events,
        schedule: appointmentSchedule,
      });
      setDraftStartTime(nextRange.start);
      setDraftEndTime(nextRange.end);
    }
  }

  function handleDraftDateChange(dateKey: string) {
    clearBlockSubmitState();
    setDraftDate(dateKey);
    if (!editingBlock) {
      setHasManualBlockDateSelection(true);
      setSelectedBlockDates((current) =>
        !hasManualBlockDateSelection && current.length <= 1
          ? [dateKey]
          : sortDateKeys([...current, dateKey]),
      );
    }
    const nextRange = getFirstAvailableRange({
      dateKey,
      editingBlockId: editingBlock?.id ?? null,
      events,
      schedule: appointmentSchedule,
      durationMinutes: draftDurationMinutes,
    });
    setDraftStartTime(nextRange.start);
    setDraftEndTime(nextRange.end);
  }

  function toggleBlockDate(dateKey: string) {
    if (editingBlock) {
      return;
    }

    setActivePanel("block");
    clearBlockSubmitState();
    setRequestedCalendarDateKey(null);
    setDraftDate(dateKey);
    setHasManualBlockDateSelection(true);
    setSelectedBlockDates((current) => {
      if (
        !hasManualBlockDateSelection &&
        current.length <= 1 &&
        !current.includes(dateKey)
      ) {
        return [dateKey];
      }

      const exists = current.includes(dateKey);
      const nextDates =
        exists && current.length > 1
          ? current.filter((value) => value !== dateKey)
          : exists
            ? current
            : sortDateKeys([...current, dateKey]);

      return nextDates;
    });
  }

  function removeBlockDate(dateKey: string) {
    if (editingBlock) {
      return;
    }

    if (selectedBlockDates.length <= 1) {
      return;
    }

    const nextDates = selectedBlockDates.filter((value) => value !== dateKey);
    clearBlockSubmitState();
    setSelectedBlockDates(nextDates);
    setDraftDate(nextDates[0] ?? todayKey);
  }

  function handleDraftStartChange(value: string) {
    clearBlockSubmitState();
    setDraftStartTime(value);
    setDraftEndTime(
      getFirstAvailableEndTime({
        dateKey: draftDate,
        editingBlockId: editingBlock?.id ?? null,
        events,
        schedule: appointmentSchedule,
        startTime: value,
      }),
    );
  }

  function handleTimeModeChange(nextMode: CalendarBlockTimeMode) {
    clearBlockSubmitState();
    setDraftTimeMode(nextMode);

    if (nextMode === "custom") {
      const nextRange = getFirstAvailableRange({
        dateKey: draftDate,
        editingBlockId: editingBlock?.id ?? null,
        events,
        schedule: appointmentSchedule,
        durationMinutes: draftDurationMinutes,
      });
      setDraftStartTime(nextRange.start);
      setDraftEndTime(nextRange.end);
    }
  }

  function handleCalendarEventSelect(event: AdminCalendarMorphEvent) {
    if (event.kind === "appointment" || event.kind === "external_appointment") {
      setActiveCalendarEventId(event.id);
      return;
    }

    setActivePanel("day");
  }

  async function handleBlockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedBlockRangeInvalid || isSavingBlock) {
      return;
    }

    setIsSavingBlock(true);
    setBlockSubmitState({
      message: "",
      status: "idle",
    });

    try {
      const response = await fetch("/api/admin/calendar-blocks", {
        body: new FormData(event.currentTarget),
        credentials: "same-origin",
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; ok?: boolean }
        | null;

      if (!response.ok || !payload?.ok) {
        setBlockSubmitState({
          message:
            payload?.message ??
            "Nu am putut salva block-ul. Verifica datele si incearca din nou.",
          status: "error",
        });
        return;
      }

      setBlockSubmitState({
        message: payload.message ?? "Block-ul a fost salvat.",
        status: "success",
      });
      router.refresh();
    } catch {
      setBlockSubmitState({
        message: "Nu am putut contacta serverul. Incearca din nou.",
        status: "error",
      });
    } finally {
      setIsSavingBlock(false);
    }
  }

  function renderTabs(selectedDateKey: string | null) {
    return (
      <div className="mb-5 grid grid-cols-3 gap-2 rounded-full bg-white p-1 shadow-[inset_0_0_0_1px_rgba(177,179,169,0.16)]">
        {tabLabels.map((tab) => (
          <button
            className={clsx(
              "rounded-full px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] transition",
              activePanel === tab.value
                ? "bg-[#31332c] text-[#fff7f3]"
                : "text-[#5e6058] hover:bg-[#f5f4ed] hover:text-[#31332c]",
            )}
            key={tab.value}
            onClick={() => {
              if (tab.value === "block") {
                beginNewBlock(selectedDateKey ?? draftDate);
                return;
              }

              const nextRequestedDateKey =
                selectedBlockDates[0] ?? selectedDateKey ?? draftDate;
              setDraftDate(nextRequestedDateKey);
              setRequestedCalendarDateKey(nextRequestedDateKey);
              setActivePanel(tab.value);
            }}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  function renderSelectedDayPanel(selectedEvents: AdminCalendarMorphEvent[]) {
    return (
      <div className="space-y-3">
        {selectedEvents.length ? (
          selectedEvents.map((event) => {
            if (event.kind === "appointment") {
              return (
                <button
                  className="block w-full rounded-[1.4rem] border border-[#b1b3a9]/10 bg-white p-4 text-left transition hover:-translate-y-[1px] hover:border-[#ae8462]/20 hover:bg-[#fff7f3]"
                  key={`${event.kind}-${event.id}`}
                  onClick={() => setActiveCalendarEventId(event.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-[#f5f4ed] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#735a42]">
                      {formatTime(event.startAt)} - {formatTime(event.endAt)}
                    </span>
                    <span
                      className={clsx(
                        "rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em]",
                        statusTone(event.status),
                      )}
                    >
                      {statusLabel(event.status)}
                    </span>
                  </div>
                  <h4 className="mt-4 font-serif text-2xl text-[#31332c]">
                    {event.patientName}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-[#5e6058]">
                    {event.serviceName}
                  </p>
                  {event.contact ? (
                    <p className="mt-3 truncate text-xs font-semibold text-[#797c73]">
                      {event.contact}
                    </p>
                  ) : null}
                </button>
              );
            }

            if (event.kind === "external_appointment") {
              return (
                <button
                  className="block w-full rounded-[1.4rem] border border-[#b1b3a9]/10 bg-[#f5f4ed] p-4 text-left transition hover:-translate-y-[1px] hover:border-[#797c73]/25 hover:bg-white"
                  key={`${event.kind}-${event.id}`}
                  onClick={() => setActiveCalendarEventId(event.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#735a42]">
                      {formatTime(event.startAt)} - {formatTime(event.endAt)}
                    </span>
                    <span className="rounded-full bg-[#e8e9e0] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#525151]">
                      Google
                    </span>
                  </div>
                  <h4 className="mt-4 font-serif text-2xl text-[#31332c]">
                    {event.title}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-[#5e6058]">
                    Programare externa
                  </p>
                  {event.location ? (
                    <p className="mt-3 truncate text-xs font-semibold text-[#797c73]">
                      {event.location}
                    </p>
                  ) : null}
                </button>
              );
            }

            return (
              <div
                className={clsx("rounded-[1.4rem] border p-4", blockTone(event.color))}
                key={`${event.kind}-${event.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em]">
                    {formatTime(event.startAt)} - {formatTime(event.endAt)}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em]">
                    {blockTypeLabels[event.blockType]}
                  </span>
                </div>
                <h4 className="mt-4 font-serif text-2xl text-current">{event.title}</h4>
                {event.description ? (
                  <p className="mt-2 text-sm font-semibold leading-6 opacity-80">
                    {event.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition hover:bg-white"
                    onClick={() => beginEditBlock(event)}
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editeaza
                  </button>
                  <form action="/api/admin/calendar-blocks/archive" method="post">
                    <input name="id" readOnly type="hidden" value={event.id} />
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#752121] transition hover:bg-white"
                      type="submit"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Arhiveaza
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[#b1b3a9]/30 bg-white p-5 text-sm font-semibold leading-7 text-[#5e6058]">
            Nu exista programari sau blocuri in aceasta zi.
          </div>
        )}
      </div>
    );
  }

  function renderBlockForm() {
    return (
      <form className={clsx(styles.formFlow, "space-y-4")} onSubmit={handleBlockSubmit}>
        <input name="id" readOnly type="hidden" value={editingBlock?.id ?? ""} />
        <input
          name="dates"
          readOnly
          type="hidden"
          value={blockDateKeys.join(",")}
        />
        <input name="time_mode" readOnly type="hidden" value={draftTimeMode} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#735a42]">
              {editingBlock ? "Editeaza block" : "Block custom"}
            </p>
            <div className="group relative mt-2 flex w-full items-center gap-3">
              <h3 className="font-serif text-3xl text-[#31332c]">
                {editingBlock ? "Actualizeaza intervalul" : "Adauga in program"}
              </h3>
              <button
                aria-label="Fiecare block ocupa disponibilitatea. Sloturile publice si cele din admin nu se vor putea suprapune peste el."
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff3e6] text-[#735a42] transition hover:bg-[#ffdcbd] focus:outline-none focus:ring-2 focus:ring-[#ffdcbd]"
                type="button"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
              <span className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-full max-w-[20rem] rounded-2xl bg-[#31332c] px-4 py-3 text-xs font-semibold leading-5 text-[#fff7f3] opacity-0 shadow-[0px_12px_32px_rgba(49,51,44,0.16)] transition group-focus-within:opacity-100 group-hover:opacity-100">
                Fiecare block ocupa disponibilitatea. Sloturile publice si cele
                din admin nu se vor putea suprapune peste el.
              </span>
            </div>
          </div>
          <button
            className={clsx(
              "inline-flex shrink-0 items-center gap-2 rounded-full bg-[#31332c] px-4 py-2.5 text-xs font-bold !text-[#fff7f3] transition hover:bg-[#0e0e0c] hover:!text-[#fff7f3]",
              (selectedBlockRangeInvalid || isSavingBlock) &&
                "cursor-not-allowed opacity-45",
            )}
            disabled={selectedBlockRangeInvalid || isSavingBlock}
            type="submit"
          >
            <Clock3 className="h-3.5 w-3.5" />
            {isSavingBlock ? "Se salveaza..." : editingBlock ? "Salveaza" : "Adauga block"}
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
            Titlu
          </span>
          <input
            className="mt-2 min-h-12 w-full rounded-2xl border-0 bg-[#efeee6] px-4 text-sm font-semibold text-[#31332c] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#ffdcbd]"
            name="title"
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Ex: Pauza, Consult extern, Program cabinet"
            required
            value={draftTitle}
          />
        </label>

        <div>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
            Timp blocat
          </span>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-[#efeee6] p-1">
            {[
              {
                label: "Toata ziua",
                value: "all_day" as const,
              },
              {
                label: "Ore custom",
                value: "custom" as const,
              },
            ].map((option) => (
              <button
                className={clsx(
                  "rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition",
                  draftTimeMode === option.value
                    ? "bg-white text-[#31332c]"
                    : "text-[#5e6058] hover:bg-white/60 hover:text-[#31332c]",
                )}
                key={option.value}
                onClick={() => handleTimeModeChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-[#797c73]">
            Toata ziua foloseste automat programul cabinetului pentru fiecare zi
            selectata. Ore custom iti permite sa blochezi doar un interval.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AppointmentDateFilter
              allowClear={false}
              defaultValue={draftDate}
              key={`date-${draftDate}`}
              label="Data"
              name="date"
              onValueChange={handleDraftDateChange}
            />
          </div>
          {!editingBlock ? (
            <div className={clsx(styles.dropIn, "sm:col-span-2")}>
              <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3">
                {selectedBlockDates.map((dateKey) => (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[#fff3e6] px-3 py-1.5 text-xs font-bold text-[#654d35] transition hover:bg-[#ffdcbd]"
                    key={dateKey}
                    onClick={() => removeBlockDate(dateKey)}
                    type="button"
                  >
                    {formatDateKey(dateKey)}
                    <span aria-hidden="true">x</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#797c73]">
                Poti selecta mai multe zile direct din calendarul din stanga.
                Intervalul ales se aplica fiecarei zile selectate.
              </p>
            </div>
          ) : null}
          {draftTimeMode === "all_day" ? (
            <div className={clsx(styles.dropIn, "sm:col-span-2 rounded-2xl bg-[#f5f4ed] p-4")}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#735a42]">
                Se blocheaza programul complet
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5e6058]">
                Pentru fiecare zi selectata salvam intervalul complet din
                setarile cabinetului. Daca o zi nu are program activ sau are
                deja programari, salvarea este blocata.
              </p>
            </div>
          ) : (
            <>
              <div className={clsx(styles.dropIn, "block")}>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
                  Inceput
                </span>
                <div className="mt-2">
                  <AppointmentFilterSelect
                    allowEmpty={false}
                    defaultValue={draftStartTime}
                    key={`start-${draftStartTime}`}
                    label="Inceput"
                    name="start_time"
                    onValueChange={handleDraftStartChange}
                    options={startTimeOptions}
                    placeholder="Alege ora"
                  />
                </div>
              </div>
              <div className={clsx(styles.dropIn, "block")}>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
                  Final
                </span>
                <div className="mt-2">
                  <AppointmentFilterSelect
                    allowEmpty={false}
                    defaultValue={draftEndTime}
                    key={`end-${draftEndTime}`}
                    label="Final"
                    name="end_time"
                    onValueChange={setDraftEndTime}
                    options={endTimeOptions}
                    placeholder="Alege ora"
                  />
                </div>
              </div>
            </>
          )}
          {draftTimeMode === "all_day" ? (
            <div className="hidden">
              <AppointmentFilterSelect
                allowEmpty={false}
                defaultValue={draftStartTime}
                label="Inceput"
                name="start_time"
                options={startTimeOptions}
                placeholder="Alege ora"
              />
              <AppointmentFilterSelect
                allowEmpty={false}
                defaultValue={draftEndTime}
                label="Final"
                name="end_time"
                options={endTimeOptions}
                placeholder="Alege ora"
              />
            </div>
          ) : null}
        </div>

        {selectedBlockRangeInvalid ? (
          <p className={clsx(styles.dropIn, "rounded-2xl bg-[#fff3e6] px-4 py-3 text-xs font-bold leading-5 text-[#654d35]")}>
            {draftTimeMode === "all_day"
              ? "Una dintre zile nu are program activ sau se suprapune peste programari ori alte blocuri."
              : "Alege un interval din programul cabinetului, fara suprapunere peste programari sau alte blocuri."}
          </p>
        ) : null}

        {blockSubmitState.status !== "idle" && blockSubmitState.message ? (
          <p
            className={clsx(
              styles.dropIn,
              "rounded-2xl px-4 py-3 text-xs font-bold leading-5",
              blockSubmitState.status === "success"
                ? "bg-[#edf6ee] text-[#3f6a4b]"
                : "bg-[#fff3e6] text-[#654d35]",
            )}
          >
            {blockSubmitState.message}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
              Tip
            </span>
            <div className="mt-2">
              <AppointmentFilterSelect
                allowEmpty={false}
                defaultValue={draftType}
                key={`type-${draftType}`}
                label="Tip"
                name="block_type"
                onValueChange={(value) => setDraftType(value as CalendarBlockType)}
                options={blockTypeOptions}
                placeholder="Alege tipul"
              />
            </div>
          </div>
          <div className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
              Culoare
            </span>
            <div className="mt-2">
              <AppointmentFilterSelect
                allowEmpty={false}
                defaultValue={draftColor}
                key={`color-${draftColor}`}
                label="Culoare"
                name="color"
                onValueChange={(value) => setDraftColor(value as CalendarBlockColor)}
                options={blockColorOptions}
                placeholder="Alege culoarea"
              />
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
            Detalii
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-none rounded-2xl border-0 bg-[#efeee6] px-4 py-3 text-sm font-semibold leading-7 text-[#31332c] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#ffdcbd]"
            name="description"
            onChange={(event) => setDraftDescription(event.target.value)}
            placeholder="Optional: note interne despre interval."
            value={draftDescription}
          />
        </label>

        {editingBlock ? (
          <div className={clsx(styles.dropIn, "flex flex-wrap gap-3")}>
            <button
              className="rounded-full bg-[#efeee6] px-5 py-3 text-sm font-bold text-[#31332c] transition hover:bg-[#e2e3d9]"
              onClick={() => beginNewBlock(draftDate)}
              type="button"
            >
              Renunta
            </button>
          </div>
        ) : null}
      </form>
    );
  }

  function renderAppointmentPanel(dateKey: string | null) {
    const href = `/admin/appointments/new?date=${encodeURIComponent(dateKey ?? draftDate)}`;

    return (
      <div className="rounded-[1.5rem] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#735a42]">
          Programare noua
        </p>
        <h3 className="mt-2 font-serif text-3xl text-[#31332c]">
          Creeaza o programare pentru ziua selectata
        </h3>
        <p className="mt-4 text-sm font-semibold leading-7 text-[#5e6058]">
          Folosim wizard-ul existent pentru pacient, serviciu si slot. Data
          selectata aici va fi precompletata in pasul de programare.
        </p>
        <Link
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#31332c] px-5 py-3 text-sm font-bold !text-[#fff7f3] transition hover:bg-[#0e0e0c] hover:!text-[#fff7f3]"
          href={href}
        >
          <Plus className="h-4 w-4" />
          Deschide wizard-ul
        </Link>
      </div>
    );
  }

  function renderAppointmentDetailSlide(appointment: AppointmentCalendarEvent) {
    const phoneHref = appointment.phone
      ? `tel:${appointment.phone.replace(/[^\d+]/g, "")}`
      : null;

    return (
      <div className="rounded-[1.75rem] bg-[#fbf9f4] p-5 md:p-6">
        <button
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b1b3a9]/16 bg-white px-4 py-2 text-sm font-bold text-[#5f5e5e] transition hover:bg-[#fff7f3] hover:text-[#31332c]"
          onClick={() => setActiveCalendarEventId(null)}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Inapoi la calendar
        </button>

        <article className="relative overflow-hidden rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#ffdcbd]/25 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 border-b border-[#b1b3a9]/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#735a42]">
                <CalendarCheck className="h-4 w-4" />
                Detalii programare
              </p>
              <h3 className="mt-4 font-serif text-5xl leading-none tracking-[-0.04em] text-[#31332c]">
                {appointment.patientName}
              </h3>
              <p className="mt-4 text-lg font-semibold text-[#5e6058]">
                {appointment.serviceName}
              </p>
            </div>

            <div className="min-w-[14rem] rounded-[1.5rem] bg-[#f5f4ed] p-5">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
                Data si ora
              </p>
              <p className="mt-3 font-serif text-3xl leading-none text-[#31332c]">
                {formatDate(appointment.startAt)}
              </p>
              <p className="mt-3 text-base font-bold text-[#5e6058]">
                {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.25rem] bg-[#f5f4ed] p-4">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
                Status
              </p>
              <span
                className={clsx(
                  "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]",
                  statusTone(appointment.status),
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {statusLabel(appointment.status)}
              </span>
            </div>

            <div className="rounded-[1.25rem] bg-[#f5f4ed] p-4">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
                Evaluare Nutritionala
              </p>
              <span
                className={clsx(
                  "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]",
                  intakeTone(appointment.intakeStatus),
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                {intakeLabel(appointment.intakeStatus)}
              </span>
            </div>

            <div className="rounded-[1.25rem] bg-[#f5f4ed] p-4">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
                Google Calendar
              </p>
              <span
                className={clsx(
                  "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]",
                  syncTone(appointment.syncStatus),
                )}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {syncLabel(appointment.syncStatus)}
              </span>
            </div>

            <div className="rounded-[1.25rem] bg-[#f5f4ed] p-4">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
                Sursa
              </p>
              <p className="mt-3 text-sm font-bold text-[#31332c]">
                {sourceLabel(appointment.source)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#797c73]">
                {appointment.isFirstVisit ? "Prima vizita" : "Revenire"}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-7 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.35rem] bg-[#fbf9f4] p-5">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#735a42]">
                <Mail className="h-4 w-4" />
                Email
              </p>
              <p className="mt-3 truncate text-sm font-bold text-[#31332c]">
                {appointment.email ?? "Email lipsa"}
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-[#fbf9f4] p-5">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#735a42]">
                <Phone className="h-4 w-4" />
                Telefon
              </p>
              <p className="mt-3 text-sm font-bold text-[#31332c]">
                {appointment.phone ?? "Telefon lipsa"}
              </p>
            </div>
          </div>

          {appointment.adminNotes ? (
            <div className="relative z-10 mt-7 rounded-[1.35rem] bg-[#f9f3ea] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#735a42]">
                Note interne
              </p>
              <p className="mt-3 text-sm font-semibold leading-7 text-[#5e6058]">
                {appointment.adminNotes}
              </p>
            </div>
          ) : null}

          {appointment.referenceHint ? (
            <p className="relative z-10 mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#797c73]">
              Cod programare:{" "}
              <span className="text-[#31332c]">{appointment.referenceHint}</span>
            </p>
          ) : null}

          <div className="relative z-10 mt-8 flex flex-wrap gap-3">
            {appointment.patientProfileHref ? (
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#31332c] px-5 text-sm font-bold !text-[#fff7f3] transition hover:bg-[#0e0e0c] hover:!text-[#fff7f3]"
                href={appointment.patientProfileHref}
              >
                <UserRound className="h-4 w-4" />
                Vezi profil
              </Link>
            ) : null}
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5f4ed] px-5 text-sm font-bold !text-[#31332c] transition hover:bg-[#e8e9e0] hover:!text-[#31332c]"
              href={appointment.appointmentHref}
            >
              <Stethoscope className="h-4 w-4" />
              Detalii programare
            </Link>
            {appointment.email ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5f4ed] px-5 text-sm font-bold text-[#31332c] transition hover:bg-[#e8e9e0]"
                href={`mailto:${appointment.email}`}
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            ) : null}
            {phoneHref ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5f4ed] px-5 text-sm font-bold text-[#31332c] transition hover:bg-[#e8e9e0]"
                href={phoneHref}
              >
                <Phone className="h-4 w-4" />
                Suna
              </a>
            ) : null}
          </div>
        </article>
      </div>
    );
  }

  function renderExternalAppointmentDetailSlide(
    appointment: ExternalAppointmentCalendarEvent,
  ) {
    return (
      <div className="rounded-[1.75rem] bg-[#fbf9f4] p-5 md:p-6">
        <button
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b1b3a9]/16 bg-white px-4 py-2 text-sm font-bold text-[#5f5e5e] transition hover:bg-[#fff7f3] hover:text-[#31332c]"
          onClick={() => setActiveCalendarEventId(null)}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Inapoi la calendar
        </button>

        <article className="relative overflow-hidden rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#e8e9e0]/70 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 border-b border-[#b1b3a9]/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#735a42]">
                <CalendarCheck className="h-4 w-4" />
                Programare externa
              </p>
              <h3 className="mt-4 font-serif text-5xl leading-none tracking-[-0.04em] text-[#31332c]">
                {appointment.title}
              </h3>
              <p className="mt-4 text-lg font-semibold text-[#5e6058]">
                Importata din Google Calendar
              </p>
            </div>

            <div className="min-w-[14rem] rounded-[1.5rem] bg-[#f5f4ed] p-5">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
                Data si ora
              </p>
              <p className="mt-3 font-serif text-3xl leading-none text-[#31332c]">
                {formatDate(appointment.startAt)}
              </p>
              <p className="mt-3 text-base font-bold text-[#5e6058]">
                {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-7 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.35rem] bg-[#fbf9f4] p-5">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#735a42]">
                <ExternalLink className="h-4 w-4" />
                Google Event
              </p>
              <p className="mt-3 truncate text-sm font-bold text-[#31332c]">
                {appointment.googleEventId}
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-[#fbf9f4] p-5">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#735a42]">
                <MapPin className="h-4 w-4" />
                Locatie
              </p>
              <p className="mt-3 text-sm font-bold text-[#31332c]">
                {appointment.location ?? "Locatie lipsa"}
              </p>
            </div>
          </div>

          {appointment.description ? (
            <div className="relative z-10 mt-7 rounded-[1.35rem] bg-[#f9f3ea] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#735a42]">
                Detalii Google
              </p>
              <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-[#5e6058]">
                {appointment.description}
              </p>
            </div>
          ) : null}

          <div className="relative z-10 mt-8 flex flex-wrap gap-3">
            {appointment.googleCalendarHref ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#31332c] px-5 text-sm font-bold !text-[#fff7f3] transition hover:bg-[#0e0e0c] hover:!text-[#fff7f3]"
                href={appointment.googleCalendarHref}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
                Deschide in Google
              </a>
            ) : null}
          </div>
        </article>
      </div>
    );
  }

  function renderCalendarFooter() {
    const enabledDaysCount = Object.values(appointmentSchedule).filter(
      (day) => day.enabled,
    ).length;
    const selectedCopy =
      selectedBlockDates.length === 1
        ? formatDateKey(selectedBlockDates[0]!)
        : `${selectedBlockDates.length} zile selectate`;

    return (
      <div className={clsx(styles.calendarFooterGrid, "grid gap-3 md:grid-cols-3")}>
        <div className={clsx(styles.calendarFooterCard, "rounded-[1.35rem] bg-white p-4")}>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
            Program activ
          </p>
          <p className="mt-2 font-serif text-2xl text-[#31332c]">
            {enabledDaysCount} zile
          </p>
          <p className={clsx(styles.calendarFooterCardDescription, "text-xs font-semibold leading-5 text-[#5e6058]")}>
            Setarile cabinetului filtreaza automat orele disponibile.
          </p>
        </div>
        <div className={clsx(styles.calendarFooterCard, "rounded-[1.35rem] bg-[#fff3e6] p-4 text-[#654d35]")}>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em]">
            Selectie block
          </p>
          <p className="mt-2 font-serif text-2xl text-current">{selectedCopy}</p>
          <p className={clsx(styles.calendarFooterCardDescription, "text-xs font-semibold leading-5 opacity-80")}>
            In modul Adauga bloc poti selecta zile multiple din calendar.
          </p>
        </div>
        <div className={clsx(styles.calendarFooterCard, "rounded-[1.35rem] bg-white p-4")}>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
            Regula overlap
          </p>
          <p className="mt-2 font-serif text-2xl text-[#31332c]">Zero</p>
          <p className={clsx(styles.calendarFooterCardDescription, "text-xs font-semibold leading-5 text-[#5e6058]")}>
            Programarile si blocurile existente dezactiveaza intervalele ocupate.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#735a42]">
              Calendar cabinet
            </span>
            <h1 className="mt-3 font-serif text-5xl leading-none text-[#31332c]">
              Program si disponibilitate
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e6058]">
              Vezi programarile reale impreuna cu blocurile custom. Orice bloc
              custom ocupa disponibilitatea, astfel sloturile publice si cele
              create din admin nu se pot suprapune peste el.
            </p>
          </div>
          <div className="grid gap-3 text-sm font-semibold text-[#5e6058] sm:grid-cols-2 xl:grid-cols-4">
            <span className="rounded-2xl bg-[#f5f4ed] px-5 py-3">
              {appointmentCount} programari
            </span>
            <span className="rounded-2xl bg-[#e8e9e0] px-5 py-3 text-[#525151]">
              {externalAppointmentCount} externe
            </span>
            <span className="rounded-2xl bg-[#fff3e6] px-5 py-3 text-[#654d35]">
              {blockCount} blocuri
            </span>
            <span className="rounded-2xl bg-[#edf6ee] px-5 py-3 text-[#3f6a4b]">
              Disponibilitate blocata
            </span>
          </div>
        </div>
      </section>

      <MorphEventsCalendar
        activeEventId={activeCalendarEventId}
        allowEmptyDaySelection
        calendarFooter={renderCalendarFooter()}
        className="!rounded-[2.5rem]"
        countLabel={(count) => `${count} intrari in calendar`}
        description="Acelasi calendar morph din cont, adaptat pentru programari si blocuri operationale."
        events={calendarEvents}
        multiSelectedDateKeys={
          activePanel === "block" && !editingBlock ? selectedBlockDates : []
        }
        onEventSelect={handleCalendarEventSelect}
        onMultiDateToggle={toggleBlockDate}
        onSelectedDateChange={handleSelectedDateChange}
        renderActiveEvent={(event) =>
          event.kind === "appointment"
            ? renderAppointmentDetailSlide(event)
            : event.kind === "external_appointment"
              ? renderExternalAppointmentDetailSlide(event)
              : null
        }
        renderSidePanel={({ selectedDate, selectedDateKey, selectedEvents }) => {
          const panelDateKey =
            activePanel === "block"
              ? blockDateKeys[0] ?? draftDate
              : selectedDateKey;
          const panelDateLabel =
            activePanel === "block" && blockDateKeys.length > 1
              ? `${blockDateKeys.length} zile selectate`
              : formatDate(
                  panelDateKey ? `${panelDateKey}T12:00:00+03:00` : selectedDate,
                );

          return (
            <div className="flex h-full min-h-0 flex-col">
              {renderTabs(selectedDateKey)}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#797c73]">
                  Zi selectata
                </p>
                <h3 className="mt-2 font-serif text-3xl italic text-[#31332c]">
                  {panelDateLabel}
                </h3>
              </div>

              <div
                className={clsx(styles.panelBody, "min-h-0 flex-1 overflow-y-auto")}
                key={`${activePanel}-${panelDateKey ?? "empty"}`}
              >
                {activePanel === "day" ? renderSelectedDayPanel(selectedEvents) : null}
                {activePanel === "block" ? renderBlockForm() : null}
                {activePanel === "appointment"
                  ? renderAppointmentPanel(selectedDateKey)
                  : null}
              </div>
            </div>
          );
        }}
        selectionMode={activePanel === "block" && !editingBlock ? "multi" : "single"}
        requestedDateKey={
          activePanel === "block" && !editingBlock
            ? null
            : requestedCalendarDateKey
        }
        sidePanelClassName="h-[53rem] overflow-hidden"
        styleNonce={nonce}
        title="Calendar operational"
      />

      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#797c73]">
        Date incarcate: {formatDate(loadedFrom)} - {formatDate(loadedTo)}
      </p>
    </div>
  );
}
