import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SecurityDashboardRange = "24h" | "7d" | "30d";
export type SecurityDashboardSurface = "public" | "account" | "admin" | "system";
export type SecurityDashboardResult = "allowed" | "blocked" | "failed" | "succeeded";

export type SecurityDashboardFilters = {
  action: string;
  q: string;
  range: SecurityDashboardRange;
  result: "" | SecurityDashboardResult;
  surface: "" | SecurityDashboardSurface;
};

type SecurityAuditEventRecord = {
  action: string;
  actor_user_id: string | null;
  created_at: string;
  entity_id: string | null;
  entity_type: string | null;
  id: number;
  metadata: Record<string, unknown> | null;
  result: SecurityDashboardResult;
  surface: SecurityDashboardSurface;
};

type RateLimitEventRecord = {
  created_at: string;
  endpoint_key: string;
};

type CalendarSyncIssueRecord = {
  id: string;
  patient_id: string;
  service_offering_id: string | null;
  start_at: string;
  sync_error: string | null;
  sync_status: string;
  updated_at: string;
};

type SecurityActionGroup = {
  count: number;
  label: string;
};

type SecuritySummaryCard = {
  label: string;
  tone: "amber" | "ink" | "rose" | "sage";
  value: number;
};

export type SecurityDashboardData = {
  actionGroups: SecurityActionGroup[];
  calendarSyncIssues: CalendarSyncIssueRecord[];
  filters: SecurityDashboardFilters;
  rateLimitEvents: RateLimitEventRecord[];
  recentEvents: SecurityAuditEventRecord[];
  summaryCards: SecuritySummaryCard[];
  totalMatchingEvents: number;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isOneOf<T extends string>(value: string, options: readonly T[]): value is T {
  return options.includes(value as T);
}

export function normalizeSecurityDashboardFilters(
  params: Record<string, string | string[] | undefined>,
): SecurityDashboardFilters {
  const rawRange = getParam(params, "range");
  const rawSurface = getParam(params, "surface");
  const rawResult = getParam(params, "result");

  return {
    action: getParam(params, "action").trim(),
    q: getParam(params, "q").trim(),
    range: isOneOf(rawRange, ["24h", "7d", "30d"]) ? rawRange : "7d",
    result: isOneOf(rawResult, ["allowed", "blocked", "failed", "succeeded"])
      ? rawResult
      : "",
    surface: isOneOf(rawSurface, ["public", "account", "admin", "system"])
      ? rawSurface
      : "",
  };
}

export function getSecurityDashboardHref(
  filters: SecurityDashboardFilters,
  overrides: Partial<SecurityDashboardFilters> = {},
) {
  const nextFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (nextFilters.range !== "7d") {
    params.set("range", nextFilters.range);
  }

  if (nextFilters.surface) {
    params.set("surface", nextFilters.surface);
  }

  if (nextFilters.result) {
    params.set("result", nextFilters.result);
  }

  if (nextFilters.action) {
    params.set("action", nextFilters.action);
  }

  if (nextFilters.q) {
    params.set("q", nextFilters.q);
  }

  const query = params.toString();
  return query ? `/admin/security?${query}` : "/admin/security";
}

function getRangeStart(range: SecurityDashboardRange) {
  const now = new Date();
  const start = new Date(now);

  if (range === "24h") {
    start.setHours(start.getHours() - 24);
    return start;
  }

  if (range === "30d") {
    start.setDate(start.getDate() - 30);
    return start;
  }

  start.setDate(start.getDate() - 7);
  return start;
}

function matchesActionFilter(actionFilter: string, eventAction: string) {
  if (!actionFilter) {
    return true;
  }

  return eventAction === actionFilter || eventAction.startsWith(actionFilter);
}

function matchesQueryFilter(query: string, event: SecurityAuditEventRecord) {
  if (!query) {
    return true;
  }

  const haystack = [
    event.action,
    event.entity_id,
    event.entity_type,
    event.actor_user_id,
    event.surface,
    event.result,
    event.metadata ? JSON.stringify(event.metadata) : "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function getActionGroupLabel(action: string) {
  const [prefix, secondary] = action.split(".");

  if (prefix === "auth" && secondary) return `Auth · ${secondary}`;
  if (prefix === "mfa") return "MFA admin";
  if (prefix === "webhook") return "Webhook";
  if (prefix === "cron") return "Cron";
  if (prefix === "lookup") return "Lookup";
  if (prefix === "form") return "Formulare";
  if (prefix === "patient") return "Pacient";
  if (prefix === "admin") return "Admin";
  if (prefix === "booking") return "Booking";

  return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : action;
}

function buildActionGroups(events: SecurityAuditEventRecord[]) {
  const grouped = new Map<string, number>();

  events.forEach((event) => {
    const label = getActionGroupLabel(event.action);
    grouped.set(label, (grouped.get(label) ?? 0) + 1);
  });

  return [...grouped.entries()]
    .map(([label, count]) => ({ count, label }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}

export async function getSecurityDashboardData(
  filters: SecurityDashboardFilters,
): Promise<SecurityDashboardData> {
  const supabase = createSupabaseAdminClient();
  const rangeStart = getRangeStart(filters.range).toISOString();

  const [auditResult, rateLimitResult, syncIssuesResult] = await Promise.all([
    supabase
      .from("security_audit_events")
      .select(
        "id, actor_user_id, surface, action, result, entity_type, entity_id, metadata, created_at",
      )
      .gte("created_at", rangeStart)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("rate_limit_events")
      .select("endpoint_key, created_at")
      .gte("created_at", rangeStart)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("appointments")
      .select("id, patient_id, service_offering_id, sync_status, sync_error, start_at, updated_at")
      .in("sync_status", ["failed", "needs_retry"])
      .gte("updated_at", rangeStart)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  const allEvents = (auditResult.data ?? []) as SecurityAuditEventRecord[];
  const rateLimitEvents = (rateLimitResult.data ?? []) as RateLimitEventRecord[];
  const calendarSyncIssues = (syncIssuesResult.data ?? []) as CalendarSyncIssueRecord[];

  const filteredEvents = allEvents.filter((event) => {
    if (filters.surface && event.surface !== filters.surface) {
      return false;
    }

    if (filters.result && event.result !== filters.result) {
      return false;
    }

    if (!matchesActionFilter(filters.action, event.action)) {
      return false;
    }

    if (!matchesQueryFilter(filters.q, event)) {
      return false;
    }

    return true;
  });

  const summaryCards: SecuritySummaryCard[] = [
    {
      label: "Auth failures",
      tone: "rose",
      value: filteredEvents.filter(
        (event) =>
          event.action.startsWith("auth.") && (event.result === "failed" || event.result === "blocked"),
      ).length,
    },
    {
      label: "Rate-limit hits",
      tone: "amber",
      value: rateLimitEvents.length,
    },
    {
      label: "Webhook rejects",
      tone: "ink",
      value: filteredEvents.filter(
        (event) =>
          event.action.startsWith("webhook.") &&
          (event.result === "failed" || event.result === "blocked"),
      ).length,
    },
    {
      label: "Calendar sync issues",
      tone: "sage",
      value: calendarSyncIssues.length,
    },
  ];

  return {
    actionGroups: buildActionGroups(filteredEvents),
    calendarSyncIssues,
    filters,
    rateLimitEvents,
    recentEvents: filteredEvents.slice(0, 60),
    summaryCards,
    totalMatchingEvents: filteredEvents.length,
  };
}
