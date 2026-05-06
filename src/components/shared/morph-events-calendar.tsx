"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

import styles from "@/components/site/patient-appointments-calendar.module.css";

const weekdayLabels = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];
const SELECTED_DAY_ANIMATION_DURATION_MS = 420;

export type MorphCalendarEvent = {
  dayPillClassName?: string;
  endAt: string;
  id: string;
  morphPillClassName?: string;
  startAt: string;
  title: string;
};

type CalendarDay = {
  date: Date;
  inMonth: boolean;
  key: string;
};

type OverlayFrame = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type MorphContentMetric = {
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type MorphContentSourceMetrics = {
  countBadge: MorphContentMetric | null;
  dateNumber: MorphContentMetric | null;
  primaryRail: MorphContentMetric | null;
};

type SelectedDayAnimationPhase = "idle" | "opening" | "open" | "closing";

type ClosingMorphState = {
  dateKey: string;
  frame: OverlayFrame;
  sourceFrame: OverlayFrame;
  sourceMetrics: MorphContentSourceMetrics | null;
  weekKey: string;
};

type SidePanelContext<TEvent extends MorphCalendarEvent> = {
  selectedDate: Date;
  selectedDateKey: string | null;
  selectedEvents: TEvent[];
};

type MorphEventsCalendarProps<TEvent extends MorphCalendarEvent> = {
  activeEventId?: string | null;
  allowEmptyDaySelection?: boolean;
  calendarFooter?: ReactNode;
  className?: string;
  countLabel?: (count: number) => string;
  description?: string;
  events: TEvent[];
  initialEventId?: string | null;
  multiSelectedDateKeys?: string[];
  onEventSelect?: (event: TEvent) => void;
  onMultiDateToggle?: (dateKey: string) => void;
  onSelectedDateChange?: (dateKey: string | null) => void;
  renderActiveEvent?: (event: TEvent) => ReactNode;
  renderSidePanel?: (context: SidePanelContext<TEvent>) => ReactNode;
  requestedDateKey?: string | null;
  selectionMode?: "multi" | "single";
  sidePanelClassName?: string;
  title?: string;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function toDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

function parseDateKey(dateKey: string | null) {
  if (!dateKey) {
    return new Date();
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day, 12);
}

function buildCalendarDays(visibleMonth: Date) {
  const firstDayOfMonth = startOfMonth(visibleMonth);
  const offset = (firstDayOfMonth.getDay() + 6) % 7;
  const firstVisibleDay = new Date(firstDayOfMonth);
  firstVisibleDay.setDate(firstDayOfMonth.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(firstVisibleDay);
    current.setDate(firstVisibleDay.getDate() + index);

    return {
      date: current,
      inMonth:
        current.getFullYear() === visibleMonth.getFullYear() &&
        current.getMonth() === visibleMonth.getMonth(),
      key: toDateKey(current),
    } satisfies CalendarDay;
  });
}

function buildCalendarWeeks(calendarDays: CalendarDay[]) {
  return Array.from({ length: 6 }, (_, index) =>
    calendarDays.slice(index * 7, index * 7 + 7),
  );
}

function formatMonthLabel(date: Date) {
  const raw = new Intl.DateTimeFormat("ro-RO", {
    month: "long",
    year: "numeric",
  }).format(date);

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    weekday: "long",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeekKey(week: CalendarDay[]) {
  return week[0]?.key ?? "empty";
}

function getCollapsedDayEvents<TEvent extends MorphCalendarEvent>(events: TEvent[]) {
  const previewEvents = events.length > 2 ? events.slice(0, 1) : events.slice(0, 2);
  const extraEventsCount = events.length > 2 ? events.length - 1 : 0;

  return {
    extraEventsCount,
    previewEvents,
  };
}

function getShiftClassName(
  index: number,
  activeDayIndex: number,
  calendarStyles: typeof styles,
) {
  if (index < activeDayIndex) {
    return (
      [
        undefined,
        calendarStyles.calendarDayShiftLeft1,
        calendarStyles.calendarDayShiftLeft2,
        calendarStyles.calendarDayShiftLeft3,
        calendarStyles.calendarDayShiftLeft4,
        calendarStyles.calendarDayShiftLeft5,
        calendarStyles.calendarDayShiftLeft6,
      ][index + 1] ?? calendarStyles.calendarDayShiftLeft6
    );
  }

  return (
    [
      undefined,
      calendarStyles.calendarDayShiftRight1,
      calendarStyles.calendarDayShiftRight2,
      calendarStyles.calendarDayShiftRight3,
      calendarStyles.calendarDayShiftRight4,
      calendarStyles.calendarDayShiftRight5,
      calendarStyles.calendarDayShiftRight6,
    ][7 - index] ?? calendarStyles.calendarDayShiftRight6
  );
}

function formatCssLength(value: number) {
  return `${Math.round(value * 1000) / 1000}px`;
}

function buildMorphMetricDeclarations(metrics: MorphContentSourceMetrics | null) {
  if (!metrics) {
    return "";
  }

  const declarations: string[] = [];

  if (metrics.dateNumber) {
    declarations.push(`--morph-date-left:${formatCssLength(metrics.dateNumber.left)};`);
    declarations.push(`--morph-date-top:${formatCssLength(metrics.dateNumber.top)};`);
  }

  if (metrics.countBadge) {
    declarations.push(`--morph-count-height:${formatCssLength(metrics.countBadge.height)};`);
    declarations.push(`--morph-count-right:${formatCssLength(metrics.countBadge.right)};`);
    declarations.push(`--morph-count-top:${formatCssLength(metrics.countBadge.top)};`);
    declarations.push(`--morph-count-width:${formatCssLength(metrics.countBadge.width)};`);
  }

  if (metrics.primaryRail) {
    declarations.push(`--morph-rail-left:${formatCssLength(metrics.primaryRail.left)};`);
    declarations.push(`--morph-rail-right:${formatCssLength(metrics.primaryRail.right)};`);
    declarations.push(`--morph-rail-top:${formatCssLength(metrics.primaryRail.top)};`);
  }

  return declarations.join("");
}

function buildMorphCardRule(
  selector: string,
  frame: OverlayFrame | null,
  metrics: MorphContentSourceMetrics | null = null,
) {
  if (!frame) {
    return "";
  }

  return `${selector}{height:${formatCssLength(frame.height)};left:${formatCssLength(frame.left)};top:${formatCssLength(frame.top)};width:${formatCssLength(frame.width)};${buildMorphMetricDeclarations(metrics)}}`;
}

function DayTileContent<TEvent extends MorphCalendarEvent>({
  date,
  events,
  setCountBadgeRef,
  setDateNumberRef,
  setPrimaryRailRef,
}: {
  date: Date;
  events: TEvent[];
  setCountBadgeRef?: (node: HTMLSpanElement | null) => void;
  setDateNumberRef?: (node: HTMLSpanElement | null) => void;
  setPrimaryRailRef?: (node: HTMLDivElement | null) => void;
}) {
  const { extraEventsCount, previewEvents } = getCollapsedDayEvents(events);

  return (
    <div className={styles.dayTileInner}>
      <div className={styles.dayTileHeader}>
        <span className={styles.dayTileDateNumber} ref={setDateNumberRef}>
          {date.getDate()}
        </span>
        {events.length ? (
          <span className={styles.dayTileCountBadge} ref={setCountBadgeRef}>
            {events.length}
          </span>
        ) : null}
      </div>

      {events.length ? (
        <div
          className={clsx(
            styles.dayTileRail,
            extraEventsCount > 0 && styles.dayTileRailStacked,
          )}
          ref={setPrimaryRailRef}
        >
          {previewEvents.map((event) => (
            <span
              className={clsx(styles.dayTilePill, event.dayPillClassName)}
              key={event.id}
            >
              {formatTime(event.startAt)}
            </span>
          ))}
          {extraEventsCount ? (
            <span className={styles.dayTileMoreBadge}>+{extraEventsCount}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SelectedDayMorphContent<TEvent extends MorphCalendarEvent>({
  date,
  events,
  expanded,
  measurement = false,
  onClose,
  onSelectEvent,
}: {
  date: Date;
  events: TEvent[];
  expanded: boolean;
  measurement?: boolean;
  onClose: () => void;
  onSelectEvent?: (event: TEvent) => void;
}) {
  const {
    extraEventsCount: collapsedExtraCount,
    previewEvents: collapsedPreviewEvents,
  } = getCollapsedDayEvents(events);
  const visibleEvents = expanded ? events : collapsedPreviewEvents;
  const disableActions = measurement || !expanded;

  return (
    <div className={styles.morphInner}>
      <span
        className={clsx(
          styles.morphDateNumber,
          expanded && styles.morphDateNumberExpanded,
        )}
      >
        {date.getDate()}
      </span>

      <span
        className={clsx(
          styles.morphCountBadge,
          expanded && styles.morphCountBadgeExpanded,
        )}
      >
        {events.length}
      </span>

      <div
        className={clsx(
          styles.morphDateMeta,
          expanded && styles.morphDateMetaExpanded,
        )}
      >
        <p
          className={clsx(
            "font-semibold uppercase tracking-[0.24em] text-[#7a5a35]",
            expanded ? "text-[0.58rem]" : "text-[0.65rem]",
          )}
        >
          Zi selectata
        </p>
        <p
          className={clsx(
            "font-serif italic leading-none text-[#31332c]",
            expanded ? "mt-0.5 text-lg" : "mt-1 text-2xl",
          )}
        >
          {formatDate(date)}
        </p>
      </div>

      <div
        className={clsx(
          styles.morphPrimaryRail,
          expanded && styles.morphPrimaryRailExpanded,
          !expanded &&
            collapsedExtraCount > 0 &&
            styles.morphPrimaryRailCollapsedStacked,
        )}
      >
        {visibleEvents.map((event) => (
          <button
            className={clsx(
              styles.morphPrimaryPill,
              expanded && styles.morphPrimaryPillExpanded,
              event.morphPillClassName,
            )}
            disabled={disableActions}
            key={event.id}
            onClick={() => onSelectEvent?.(event)}
            type="button"
          >
            {formatTime(event.startAt)}
          </button>
        ))}

        {collapsedExtraCount ? (
          <span
            className={clsx(
              styles.morphMoreBadge,
              expanded && styles.morphMoreBadgeHidden,
            )}
          >
            +{collapsedExtraCount}
          </span>
        ) : null}
      </div>

      <button
        aria-label="Inchide ziua selectata"
        className={clsx(
          styles.morphCloseButton,
          expanded && styles.morphCloseButtonExpanded,
        )}
        disabled={disableActions}
        onClick={onClose}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
    </div>
  );
}

function readMorphContentMetric(node: HTMLElement | null, source: HTMLElement) {
  if (!node) {
    return null;
  }

  const nodeRect = node.getBoundingClientRect();
  const sourceRect = source.getBoundingClientRect();

  return {
    height: nodeRect.height,
    left: nodeRect.left - sourceRect.left,
    right: sourceRect.right - nodeRect.right,
    top: nodeRect.top - sourceRect.top,
    width: nodeRect.width,
  } satisfies MorphContentMetric;
}

export function MorphEventsCalendar<TEvent extends MorphCalendarEvent>({
  activeEventId,
  allowEmptyDaySelection = false,
  calendarFooter,
  className,
  countLabel = (count) => `${count} evenimente`,
  description = "Vezi rapid zilele ocupate si detaliile lunii selectate.",
  events,
  initialEventId,
  multiSelectedDateKeys = [],
  onEventSelect,
  onMultiDateToggle,
  onSelectedDateChange,
  renderActiveEvent,
  renderSidePanel,
  requestedDateKey,
  selectionMode = "single",
  sidePanelClassName,
  title = "Calendar programari",
}: MorphEventsCalendarProps<TEvent>) {
  const isMultiSelectionMode = selectionMode === "multi";
  const initialActiveEvent = initialEventId
    ? events.find((event) => event.id === initialEventId)
    : null;
  const initialVisibleEvent =
    initialActiveEvent ??
    events.find((event) => new Date(event.endAt) >= new Date()) ??
    events[0];
  const initialMonth = initialVisibleEvent
    ? startOfMonth(new Date(initialVisibleEvent.startAt))
    : startOfMonth(new Date());
  const todayKey = toDateKey(new Date());
  const initialSelectedDateKey = initialVisibleEvent
    ? toDateKey(initialVisibleEvent.startAt)
    : allowEmptyDaySelection
      ? todayKey
      : null;
  const initialCalendarDays = buildCalendarDays(initialMonth);
  const initialWeeks = buildCalendarWeeks(initialCalendarDays);
  const initialAnimatedWeekKey = initialSelectedDateKey
    ? getWeekKey(
        initialWeeks.find((week) =>
          week.some((day) => day.key === initialSelectedDateKey),
        ) ?? [],
      )
    : null;
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    initialSelectedDateKey,
  );
  const [selectedDayPhase, setSelectedDayPhase] =
    useState<SelectedDayAnimationPhase>(
      initialVisibleEvent ? "open" : "idle",
    );
  const [animatedSelectedDateKey, setAnimatedSelectedDateKey] = useState<
    string | null
  >(initialSelectedDateKey);
  const [animatedWeekKey, setAnimatedWeekKey] = useState<string | null>(
    initialAnimatedWeekKey,
  );
  const [selectedOverlayFrame, setSelectedOverlayFrame] =
    useState<OverlayFrame | null>(null);
  const [selectedOverlaySourceMetrics, setSelectedOverlaySourceMetrics] =
    useState<MorphContentSourceMetrics | null>(null);
  const [selectedDaySettledAtSource, setSelectedDaySettledAtSource] =
    useState(false);
  const [closingMorph, setClosingMorph] = useState<ClosingMorphState | null>(
    null,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const selectedDayAnimationTimeoutRef = useRef<number | null>(null);
  const selectedDayAnimationFrameRef = useRef<number | null>(null);
  const selectedDaySettleFrameRef = useRef<number | null>(null);
  const selectedSourceMetricsFrameRef = useRef<number | null>(null);
  const closingMorphAnimationFrameRef = useRef<number | null>(null);
  const closingMorphTimeoutRef = useRef<number | null>(null);
  const selectedDayButtonRefs = useRef(
    new Map<string, HTMLButtonElement | null>(),
  );
  const selectedDayCountBadgeRefs = useRef(
    new Map<string, HTMLSpanElement | null>(),
  );
  const selectedDayDateNumberRefs = useRef(
    new Map<string, HTMLSpanElement | null>(),
  );
  const selectedDayPrimaryRailRefs = useRef(
    new Map<string, HTMLDivElement | null>(),
  );
  const selectedWeekRefs = useRef(new Map<string, HTMLDivElement | null>());
  const selectedOverlaySourceFrameRef = useRef<OverlayFrame | null>(null);
  const pendingSelectedDateKeyRef = useRef<string | null>(null);
  const lastRequestedDateKeyRef = useRef<string | null>(null);
  const calendarInstanceId = useId().replace(/:/g, "");

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, TEvent[]>();

    events.forEach((event) => {
      const key = toDateKey(event.startAt);
      const bucket = grouped.get(key) ?? [];
      bucket.push(event);
      bucket.sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      );
      grouped.set(key, bucket);
    });

    return grouped;
  }, [events]);

  const multiSelectedDateKeySet = useMemo(
    () => new Set(multiSelectedDateKeys),
    [multiSelectedDateKeys],
  );
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const weeks = useMemo(() => buildCalendarWeeks(calendarDays), [calendarDays]);
  const selectedEvents = selectedDateKey
    ? eventsByDay.get(selectedDateKey) ?? []
    : [];
  const activeEvent = activeEventId
    ? events.find((event) => event.id === activeEventId) ?? null
    : null;
  const selectedWeekKey = animatedWeekKey;
  const selectedDateForMorph = parseDateKey(animatedSelectedDateKey);
  const isMorphExpanded =
    selectedDayPhase === "opening" || selectedDayPhase === "open";
  const dynamicStyleRules = useMemo(() => {
    const scope = `[data-morph-calendar="${calendarInstanceId}"]`;
    const rules = [
      buildMorphCardRule(
        `${scope} [data-morph-card="active"]`,
        selectedOverlayFrame,
        selectedOverlaySourceMetrics,
      ),
      buildMorphCardRule(
        `${scope} [data-morph-card="closing"]`,
        closingMorph?.frame ?? null,
        closingMorph?.sourceMetrics ?? null,
      ),
    ].filter(Boolean);

    return rules.join("\n");
  }, [
    calendarInstanceId,
    closingMorph?.frame,
    closingMorph?.sourceMetrics,
    selectedOverlayFrame,
    selectedOverlaySourceMetrics,
  ]);

  function clearSelectedDayAnimationTimer() {
    if (selectedDayAnimationTimeoutRef.current) {
      window.clearTimeout(selectedDayAnimationTimeoutRef.current);
      selectedDayAnimationTimeoutRef.current = null;
    }
  }

  function clearSelectedDayAnimationFrame() {
    if (selectedDayAnimationFrameRef.current) {
      window.cancelAnimationFrame(selectedDayAnimationFrameRef.current);
      selectedDayAnimationFrameRef.current = null;
    }
  }

  function clearSelectedDaySettleFrame() {
    if (selectedDaySettleFrameRef.current) {
      window.cancelAnimationFrame(selectedDaySettleFrameRef.current);
      selectedDaySettleFrameRef.current = null;
    }
  }

  function clearSelectedSourceMetricsFrame() {
    if (selectedSourceMetricsFrameRef.current) {
      window.cancelAnimationFrame(selectedSourceMetricsFrameRef.current);
      selectedSourceMetricsFrameRef.current = null;
    }
  }

  function clearClosingMorphAnimationFrame() {
    if (closingMorphAnimationFrameRef.current) {
      window.cancelAnimationFrame(closingMorphAnimationFrameRef.current);
      closingMorphAnimationFrameRef.current = null;
    }
  }

  function clearClosingMorphTimer() {
    if (closingMorphTimeoutRef.current) {
      window.clearTimeout(closingMorphTimeoutRef.current);
      closingMorphTimeoutRef.current = null;
    }
  }

  function clearClosingMorph() {
    clearClosingMorphAnimationFrame();
    clearClosingMorphTimer();
    setClosingMorph(null);
  }

  function resetSelectedDayMorphState() {
    clearSelectedDayAnimationTimer();
    clearSelectedDayAnimationFrame();
    clearSelectedDaySettleFrame();
    clearSelectedSourceMetricsFrame();
    selectedOverlaySourceFrameRef.current = null;
    setSelectedOverlayFrame(null);
    setSelectedOverlaySourceMetrics(null);
    setSelectedDaySettledAtSource(false);
  }

  function setDayButtonRef(key: string, node: HTMLButtonElement | null) {
    selectedDayButtonRefs.current.set(key, node);
  }

  function setCountBadgeRef(key: string, node: HTMLSpanElement | null) {
    selectedDayCountBadgeRefs.current.set(key, node);
  }

  function setDateNumberRef(key: string, node: HTMLSpanElement | null) {
    selectedDayDateNumberRefs.current.set(key, node);
  }

  function setPrimaryRailRef(key: string, node: HTMLDivElement | null) {
    selectedDayPrimaryRailRefs.current.set(key, node);
  }

  function setWeekRef(key: string, node: HTMLDivElement | null) {
    selectedWeekRefs.current.set(key, node);
  }

  function readSelectedDaySourceFrame() {
    if (!animatedSelectedDateKey || !selectedWeekKey) {
      return null;
    }

    const weekNode = selectedWeekRefs.current.get(selectedWeekKey);
    const dayButtonNode = selectedDayButtonRefs.current.get(
      animatedSelectedDateKey,
    );

    if (!weekNode || !dayButtonNode) {
      return null;
    }

    const weekRect = weekNode.getBoundingClientRect();
    const dayRect = dayButtonNode.getBoundingClientRect();

    return {
      height: dayRect.height,
      left: dayRect.left - weekRect.left,
      top: dayRect.top - weekRect.top,
      width: dayRect.width,
    } satisfies OverlayFrame;
  }

  function settleSelectedDayClose() {
    clearSelectedDaySettleFrame();
    clearSelectedDayAnimationFrame();
    setSelectedDaySettledAtSource(true);

    selectedDaySettleFrameRef.current = window.requestAnimationFrame(() => {
      selectedDaySettleFrameRef.current = window.requestAnimationFrame(() => {
        finalizeSelectedDayClose();
        selectedDaySettleFrameRef.current = null;
      });
    });
  }

  function finalizeSelectedDayClose() {
    const nextDateKey = pendingSelectedDateKeyRef.current;

    resetSelectedDayMorphState();

    if (nextDateKey) {
      pendingSelectedDateKeyRef.current = null;
      openSelectedDay(nextDateKey);
      return;
    }

    setSelectedDayPhase("idle");
    setAnimatedSelectedDateKey(null);
    setAnimatedWeekKey(null);
  }

  function finishClosingMorph(dateKey: string) {
    clearClosingMorphAnimationFrame();
    clearClosingMorphTimer();
    setClosingMorph((current) =>
      current?.dateKey === dateKey ? null : current,
    );
  }

  function startClosingMorphFromActive() {
    if (!animatedSelectedDateKey || !animatedWeekKey) {
      return false;
    }

    const sourceFrame =
      selectedOverlaySourceFrameRef.current ?? readSelectedDaySourceFrame();

    if (!sourceFrame) {
      return false;
    }

    const dateKey = animatedSelectedDateKey;
    const weekKey = animatedWeekKey;
    const targetFrame = selectedOverlayFrame ?? sourceFrame;

    clearClosingMorph();
    setClosingMorph({
      dateKey,
      frame: targetFrame,
      sourceFrame,
      sourceMetrics: selectedOverlaySourceMetrics,
      weekKey,
    });

    if (prefersReducedMotion) {
      finishClosingMorph(dateKey);
      return true;
    }

    closingMorphAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setClosingMorph((current) =>
        current?.dateKey === dateKey
          ? {
              ...current,
              frame: current.sourceFrame,
            }
          : current,
      );
      closingMorphAnimationFrameRef.current = null;
    });
    closingMorphTimeoutRef.current = window.setTimeout(() => {
      finishClosingMorph(dateKey);
    }, SELECTED_DAY_ANIMATION_DURATION_MS);

    return true;
  }

  function openSelectedDay(dateKey: string) {
    const dayEvents = eventsByDay.get(dateKey) ?? [];

    setSelectedDateKey(dateKey);
    onSelectedDateChange?.(dateKey);

    if (!dayEvents.length && !allowEmptyDaySelection) {
      resetSelectedDayMorphState();
      setAnimatedSelectedDateKey(null);
      setAnimatedWeekKey(null);
      setSelectedDayPhase("idle");
      return;
    }

    resetSelectedDayMorphState();
    pendingSelectedDateKeyRef.current = null;
    setAnimatedSelectedDateKey(dateKey);
    const nextWeek = weeks.find((week) => week.some((day) => day.key === dateKey));
    setAnimatedWeekKey(nextWeek ? getWeekKey(nextWeek) : null);
    setSelectedDayPhase(prefersReducedMotion ? "open" : "opening");

    if (prefersReducedMotion) {
      return;
    }

    selectedDayAnimationTimeoutRef.current = window.setTimeout(() => {
      setSelectedDayPhase("open");
      selectedDayAnimationTimeoutRef.current = null;
    }, SELECTED_DAY_ANIMATION_DURATION_MS);
  }

  function switchSelectedDay(dateKey: string) {
    startClosingMorphFromActive();
    pendingSelectedDateKeyRef.current = null;
    openSelectedDay(dateKey);
  }

  function closeSelectedDay() {
    if (
      !animatedSelectedDateKey ||
      selectedDayPhase === "closing" ||
      selectedDaySettledAtSource
    ) {
      return;
    }

    clearSelectedDayAnimationTimer();
    clearSelectedDayAnimationFrame();

    if (prefersReducedMotion) {
      finalizeSelectedDayClose();
      return;
    }

    const sourceFrame =
      selectedOverlaySourceFrameRef.current ?? readSelectedDaySourceFrame();

    if (sourceFrame) {
      setSelectedOverlayFrame(sourceFrame);
    }

    setSelectedDayPhase("closing");
    selectedDayAnimationTimeoutRef.current = window.setTimeout(() => {
      settleSelectedDayClose();
      selectedDayAnimationTimeoutRef.current = null;
    }, SELECTED_DAY_ANIMATION_DURATION_MS);
  }

  function selectDateKey(dateKey: string | null) {
    if (!dateKey) {
      if (selectedDateKey) {
        pendingSelectedDateKeyRef.current = null;
        onSelectedDateChange?.(null);
        setSelectedDateKey(null);
        closeSelectedDay();
      }

      return;
    }

    if (selectedDateKey === dateKey) {
      const dayEvents = eventsByDay.get(dateKey) ?? [];
      const canOpenMorph = dayEvents.length > 0 || allowEmptyDaySelection;

      if (
        canOpenMorph &&
        (selectedDayPhase === "closing" || selectedDaySettledAtSource)
      ) {
        pendingSelectedDateKeyRef.current = dateKey;
        return;
      }

      if (
        canOpenMorph &&
        (!animatedSelectedDateKey || selectedDayPhase === "idle")
      ) {
        openSelectedDay(dateKey);
      }

      return;
    }

    const dayEvents = eventsByDay.get(dateKey) ?? [];

    if (!dayEvents.length && !allowEmptyDaySelection) {
      pendingSelectedDateKeyRef.current = null;
      setSelectedDateKey(dateKey);
      onSelectedDateChange?.(dateKey);
      if (animatedSelectedDateKey) {
        closeSelectedDay();
      }
      return;
    }

    if (animatedSelectedDateKey) {
      switchSelectedDay(dateKey);
      return;
    }

    openSelectedDay(dateKey);
  }

  function handleDayActivation(dateKey: string, hasEvents: boolean) {
    if (isMultiSelectionMode) {
      onMultiDateToggle?.(dateKey);
      return;
    }

    selectDateKey(allowEmptyDaySelection || hasEvents ? dateKey : null);
  }

  function handleMorphTransitionEnd(
    event: React.TransitionEvent<HTMLDivElement>,
  ) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (
      selectedDayPhase !== "closing" ||
      selectedDaySettledAtSource ||
      (event.propertyName !== "width" &&
        event.propertyName !== "left" &&
        event.propertyName !== "transform")
    ) {
      return;
    }

    settleSelectedDayClose();
  }

  useEffect(() => {
    if (
      !isMultiSelectionMode ||
      !animatedSelectedDateKey ||
      selectedDayPhase === "closing" ||
      selectedDaySettledAtSource
    ) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      pendingSelectedDateKeyRef.current = null;
      onSelectedDateChange?.(null);
      setSelectedDateKey(null);
      closeSelectedDay();
    });

    return () => window.cancelAnimationFrame(frame);
    // We intentionally react only to the mode flip, so the open card can
    // animate closed instead of disappearing when multi-select starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiSelectionMode]);

  useEffect(() => {
    if (!requestedDateKey || isMultiSelectionMode) {
      return;
    }

    if (
      requestedDateKey === lastRequestedDateKeyRef.current &&
      selectedDateKey === requestedDateKey &&
      selectedDayPhase === "open"
    ) {
      return;
    }

    lastRequestedDateKeyRef.current = requestedDateKey;
    const frame = window.requestAnimationFrame(() => {
      selectDateKey(requestedDateKey);
    });

    return () => window.cancelAnimationFrame(frame);
    // `selectDateKey` owns the choreography; this effect is a one-shot request
    // from parent tabs rather than a derived-state sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiSelectionMode, requestedDateKey]);

  useLayoutEffect(() => {
    if (!animatedSelectedDateKey || !selectedWeekKey) {
      return;
    }

    const weekNode = selectedWeekRefs.current.get(selectedWeekKey);
    const dayButtonNode = selectedDayButtonRefs.current.get(
      animatedSelectedDateKey,
    );

    if (!weekNode || !dayButtonNode) {
      return;
    }

    const weekRect = weekNode.getBoundingClientRect();
    const dayRect = dayButtonNode.getBoundingClientRect();
    const sourceFrame = {
      height: dayRect.height,
      left: dayRect.left - weekRect.left,
      top: dayRect.top - weekRect.top,
      width: dayRect.width,
    } satisfies OverlayFrame;
    const targetFrame = {
      height: dayRect.height,
      left: 0,
      top: dayRect.top - weekRect.top,
      width: weekRect.width,
    } satisfies OverlayFrame;

    selectedOverlaySourceFrameRef.current = sourceFrame;
    const nextSourceMetrics = {
      countBadge: readMorphContentMetric(
        selectedDayCountBadgeRefs.current.get(animatedSelectedDateKey) ?? null,
        dayButtonNode,
      ),
      dateNumber: readMorphContentMetric(
        selectedDayDateNumberRefs.current.get(animatedSelectedDateKey) ?? null,
        dayButtonNode,
      ),
      primaryRail: readMorphContentMetric(
        selectedDayPrimaryRailRefs.current.get(animatedSelectedDateKey) ?? null,
        dayButtonNode,
      ),
    } satisfies MorphContentSourceMetrics;

    clearSelectedSourceMetricsFrame();
    selectedSourceMetricsFrameRef.current = window.requestAnimationFrame(() => {
      setSelectedOverlaySourceMetrics(nextSourceMetrics);
      selectedSourceMetricsFrameRef.current = null;
    });

    if (prefersReducedMotion) {
      setSelectedOverlayFrame(targetFrame);
      return;
    }

    if (selectedDayPhase !== "opening") {
      if (selectedDayPhase === "open") {
        setSelectedOverlayFrame(targetFrame);
      }

      return;
    }

    setSelectedOverlayFrame(sourceFrame);
    clearSelectedDayAnimationFrame();
    selectedDayAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setSelectedOverlayFrame(targetFrame);
      selectedDayAnimationFrameRef.current = null;
    });
  }, [
    animatedSelectedDateKey,
    prefersReducedMotion,
    selectedDayPhase,
    selectedWeekKey,
    weeks,
  ]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncReducedMotionPreference() {
      setPrefersReducedMotion(mediaQuery.matches);
    }

    syncReducedMotionPreference();
    mediaQuery.addEventListener("change", syncReducedMotionPreference);

    return () => {
      clearSelectedDayAnimationTimer();
      clearSelectedDayAnimationFrame();
      clearSelectedDaySettleFrame();
      clearSelectedSourceMetricsFrame();
      clearClosingMorphAnimationFrame();
      clearClosingMorphTimer();
      selectedOverlaySourceFrameRef.current = null;
      mediaQuery.removeEventListener("change", syncReducedMotionPreference);
    };
  }, []);

  function renderDayTileContent(day: CalendarDay, eventsForDay: TEvent[]) {
    return (
      <DayTileContent
        date={day.date}
        events={eventsForDay}
        setCountBadgeRef={(node) => setCountBadgeRef(day.key, node)}
        setDateNumberRef={(node) => setDateNumberRef(day.key, node)}
        setPrimaryRailRef={(node) => setPrimaryRailRef(day.key, node)}
      />
    );
  }

  return (
    <section
      className={clsx(
        "rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] md:p-8",
        className,
      )}
      data-morph-calendar={calendarInstanceId}
    >
      {dynamicStyleRules ? <style jsx global>{dynamicStyleRules}</style> : null}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
            Programari
          </span>
          <h2 className="font-serif text-4xl text-[#31332c]">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5e6058]">
            {description}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f4ed] px-4 py-2 text-[#5f5e5e]">
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm font-semibold">{countLabel(events.length)}</span>
        </div>
      </div>

      <div className="grid overflow-hidden">
        <div
          className={clsx(
            "col-start-1 row-start-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            activeEvent && renderActiveEvent
              ? "pointer-events-none -translate-x-[110%] opacity-0"
              : "translate-x-0 opacity-100",
          )}
        >
          <div
            className={clsx(
              "grid gap-6 lg:items-start",
              renderSidePanel
                ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)]"
                : "lg:grid-cols-1",
            )}
          >
            <div className="rounded-[1.75rem] bg-[#f5f4ed] p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#b1b3a9]/16 bg-white text-[#5f5e5e] transition hover:bg-[#fff7f3]"
                  onClick={() =>
                    setVisibleMonth((current) => addMonths(current, -1))
                  }
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="font-serif text-2xl text-[#31332c]">
                  {formatMonthLabel(visibleMonth)}
                </p>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#b1b3a9]/16 bg-white text-[#5f5e5e] transition hover:bg-[#fff7f3]"
                  onClick={() =>
                    setVisibleMonth((current) => addMonths(current, 1))
                  }
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-2">
                  {weekdayLabels.map((label) => (
                    <span
                      className="pb-1 text-center text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#797c73]"
                      key={label}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {weeks.map((week) => {
                  const weekKey = getWeekKey(week);
                  const activeSelectedEvents = animatedSelectedDateKey
                    ? eventsByDay.get(animatedSelectedDateKey) ?? []
                    : [];
                  const activeDayIndex = week.findIndex(
                    (day) => day.key === animatedSelectedDateKey,
                  );
                  const activeMorphCanRender =
                    activeSelectedEvents.length > 0 || allowEmptyDaySelection;
                  const weekContainsActiveMorph =
                    animatedWeekKey === weekKey &&
                    activeDayIndex >= 0 &&
                    activeMorphCanRender;
                  const closingSelectedEvents = closingMorph
                    ? eventsByDay.get(closingMorph.dateKey) ?? []
                    : [];
                  const closingMorphCanRender =
                    closingSelectedEvents.length > 0 || allowEmptyDaySelection;
                  const weekContainsClosingMorph =
                    closingMorph?.weekKey === weekKey &&
                    closingMorphCanRender;
                  const morphsShareWeek =
                    weekContainsActiveMorph &&
                    weekContainsClosingMorph &&
                    closingMorph?.dateKey !== animatedSelectedDateKey;
                  const isMorphWeek =
                    weekContainsActiveMorph || weekContainsClosingMorph;

                  if (isMorphWeek) {
                    return (
                      <div
                        className={clsx(
                          styles.selectedWeek,
                          weekContainsClosingMorph &&
                            !weekContainsActiveMorph &&
                            styles.selectedWeekClosing,
                        )}
                        key={`week-${weekKey}`}
                        ref={(node) => setWeekRef(weekKey, node)}
                      >
                        {week.map((day, index) => {
                          const dayEvents = eventsByDay.get(day.key) ?? [];
                          const isActiveSelected =
                            weekContainsActiveMorph &&
                            day.key === animatedSelectedDateKey;
                          const isClosingSelected =
                            weekContainsClosingMorph &&
                            day.key === closingMorph?.dateKey;
                          const isSelected =
                            isActiveSelected || isClosingSelected;
                          const isMultiSelected = multiSelectedDateKeySet.has(day.key);
                          const motionClass = isSelected
                            ? styles.calendarDayPlaceholder
                            : morphsShareWeek
                              ? undefined
                              : weekContainsClosingMorph &&
                                  !weekContainsActiveMorph
                                ? styles.calendarDayReturning
                                : selectedDayPhase === "closing"
                                  ? styles.calendarDayReturning
                                  : styles.calendarDayShifted;
                          const shiftClass =
                            motionClass === styles.calendarDayShifted &&
                            activeDayIndex >= 0
                              ? getShiftClassName(index, activeDayIndex, styles)
                              : undefined;

                          return (
                            <button
                              className={clsx(
                                styles.calendarDayBase,
                                motionClass,
                                shiftClass,
                                "h-[5.5rem] rounded-[1.15rem] border text-left transition",
                                isMultiSelected
                                  ? "border-[#ffdcbd] bg-[#fff3e6] ring-2 ring-[#ffdcbd]/80"
                                  : dayEvents.length
                                  ? "border-[#b1b3a9]/12 bg-white hover:bg-[#fff7f3]"
                                  : "border-transparent bg-transparent hover:bg-white/70",
                                !day.inMonth && "opacity-45",
                              )}
                              key={day.key}
                              onClick={() =>
                                handleDayActivation(day.key, Boolean(dayEvents.length))
                              }
                              ref={(node) => setDayButtonRef(day.key, node)}
                              type="button"
                            >
                              {renderDayTileContent(day, dayEvents)}
                            </button>
                          );
                        })}

                        {closingMorph && weekContainsClosingMorph ? (
                          <div
                            className={clsx(
                              styles.morphCard,
                              styles.morphCardFrame,
                              styles.morphCardCollapsed,
                            )}
                            data-morph-card="closing"
                            key={`closing-${closingMorph.dateKey}`}
                          >
                            <SelectedDayMorphContent
                              date={parseDateKey(closingMorph.dateKey)}
                              events={closingSelectedEvents}
                              expanded={false}
                              onClose={() => finishClosingMorph(closingMorph.dateKey)}
                              onSelectEvent={onEventSelect}
                            />
                          </div>
                        ) : null}

                        {selectedOverlayFrame && weekContainsActiveMorph ? (
                          <div
                            className={clsx(
                              styles.morphCard,
                              styles.morphCardFrame,
                              isMorphExpanded
                                ? styles.morphCardExpanded
                                : styles.morphCardCollapsed,
                              selectedDayPhase === "open" &&
                                styles.morphCardInteractive,
                            )}
                            data-morph-card="active"
                            onTransitionEnd={handleMorphTransitionEnd}
                          >
                            {selectedDaySettledAtSource ? (
                              <DayTileContent
                                date={selectedDateForMorph}
                                events={activeSelectedEvents}
                              />
                            ) : (
                              <SelectedDayMorphContent
                                date={selectedDateForMorph}
                                events={activeSelectedEvents}
                                expanded={isMorphExpanded}
                                onClose={closeSelectedDay}
                                onSelectEvent={onEventSelect}
                              />
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-7 gap-2" key={`week-${weekKey}`}>
                      {week.map((day) => {
                        const dayEvents = eventsByDay.get(day.key) ?? [];
                        const isMultiSelected = multiSelectedDateKeySet.has(day.key);

                        return (
                          <button
                            className={clsx(
                              "h-[5.5rem] rounded-[1.15rem] border text-left transition",
                              isMultiSelected
                                ? "border-[#ffdcbd] bg-[#fff3e6] ring-2 ring-[#ffdcbd]/80"
                                : dayEvents.length
                                ? "border-[#b1b3a9]/12 bg-white hover:bg-[#fff7f3]"
                                : "border-transparent bg-transparent hover:bg-white/70",
                              selectedDateKey === day.key &&
                                "ring-2 ring-[#ffdcbd]",
                              !day.inMonth && "opacity-45",
                            )}
                            key={day.key}
                            onClick={() =>
                              handleDayActivation(day.key, Boolean(dayEvents.length))
                            }
                            ref={(node) => setDayButtonRef(day.key, node)}
                            type="button"
                          >
                            {renderDayTileContent(day, dayEvents)}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {calendarFooter ? <div className="mt-4">{calendarFooter}</div> : null}
            </div>

            {renderSidePanel ? (
              <div className={clsx("rounded-[1.75rem] bg-[#fbf9f4] p-5", sidePanelClassName)}>
                {renderSidePanel({
                  selectedDate: parseDateKey(selectedDateKey),
                  selectedDateKey,
                  selectedEvents,
                })}
              </div>
            ) : null}
          </div>
        </div>

        {renderActiveEvent ? (
          <div
            className={clsx(
              "col-start-1 row-start-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              activeEvent
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-full opacity-0",
            )}
          >
            {activeEvent ? renderActiveEvent(activeEvent) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
