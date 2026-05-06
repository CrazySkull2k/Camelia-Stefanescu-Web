import Link from "next/link";
import { ShieldAlert, ShieldCheck, ShieldEllipsis, ShieldX } from "lucide-react";

import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { formatDateTime } from "@/lib/utils/dates";
import { requireOwnerAdminAal2User } from "@/modules/auth/guards";
import {
  getSecurityDashboardData,
  getSecurityDashboardHref,
  normalizeSecurityDashboardFilters,
} from "@/modules/audit/security-dashboard";

type SecurityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function summarizeMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata) {
    return "Fără metadata";
  }

  const serialized = JSON.stringify(metadata);
  return serialized.length > 140 ? `${serialized.slice(0, 137)}...` : serialized;
}

function buildRateLimitGroups(endpointKeys: string[]) {
  const grouped = new Map<string, number>();

  endpointKeys.forEach((endpointKey) => {
    grouped.set(endpointKey, (grouped.get(endpointKey) ?? 0) + 1);
  });

  return [...grouped.entries()]
    .map(([endpointKey, count]) => ({ count, endpointKey }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}

function getResultTone(result: string) {
  if (result === "failed") return "bg-[#fff1ef] text-[#a13f3d]";
  if (result === "blocked") return "bg-[#fff7e8] text-[#8a6535]";
  if (result === "allowed") return "bg-[#eef8f5] text-[#2d6a57]";
  return "bg-[#f5f4ed] text-[#5e6058]";
}

function getSummaryToneClass(tone: "amber" | "ink" | "rose" | "sage") {
  if (tone === "rose") return "bg-[#fff1ef] text-[#8f4744]";
  if (tone === "amber") return "bg-[#fff7e8] text-[#8a6535]";
  if (tone === "sage") return "bg-[#eef8f5] text-[#2d6a57]";
  return "bg-[#f0efea] text-[#31332c]";
}

function SecuritySummaryIcon({ tone }: { tone: "amber" | "ink" | "rose" | "sage" }) {
  if (tone === "rose") {
    return <ShieldX className="h-5 w-5" />;
  }

  if (tone === "amber") {
    return <ShieldAlert className="h-5 w-5" />;
  }

  if (tone === "sage") {
    return <ShieldCheck className="h-5 w-5" />;
  }

  return <ShieldEllipsis className="h-5 w-5" />;
}

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminAal2User();

  const resolvedSearchParams = await searchParams;
  const filters = normalizeSecurityDashboardFilters(resolvedSearchParams);
  const dashboard = await getSecurityDashboardData(filters);
  const rateLimitGroups = buildRateLimitGroups(
    dashboard.rateLimitEvents.map((event) => event.endpoint_key),
  );

  return (
    <main className="space-y-9 pb-12">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#735a42]">
            Fortress observability
          </span>
          <h1 className="mt-4 font-serif text-5xl font-medium leading-none tracking-[-0.04em] text-[#31332c] md:text-6xl">
            Security
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-[#5e6058]">
            Evenimentele de securitate, webhooks, rate limits și problemele de sincronizare sunt
            centralizate aici pentru verificare rapidă, fără a expune controale operaționale.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["24h", "7d", "30d"] as const).map((range) => {
            const active = dashboard.filters.range === range;

            return (
              <Link
                className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition ${
                  active
                    ? "bg-[#31332c] text-[#fff7f3]"
                    : "bg-white text-[#5e6058] shadow-[0px_8px_24px_rgba(49,51,44,0.05)] hover:bg-[#f5f4ed]"
                }`}
                href={getSecurityDashboardHref(filters, { range })}
                key={range}
              >
                {range}
              </Link>
            );
          })}
        </div>
      </header>

      <form className="grid gap-4 rounded-[2rem] bg-white p-5 shadow-[0px_12px_32px_rgba(49,51,44,0.04)] md:grid-cols-[minmax(0,1fr)_12rem_12rem_13rem_auto_auto]" method="get">
        <label className="block">
          <span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
            Caută
          </span>
          <input
            className="h-12 w-full rounded-2xl border border-[#d8d5cc] bg-[#fbf9f4] px-4 text-sm font-semibold text-[#31332c] outline-none transition focus:border-[#ffdcbd] focus:ring-2 focus:ring-[#ffdcbd]/40"
            defaultValue={dashboard.filters.q}
            name="q"
            placeholder="action, entity, metadata"
            type="text"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
            Surface
          </span>
          <select
            className="h-12 w-full rounded-2xl border border-[#d8d5cc] bg-[#fbf9f4] px-4 text-sm font-semibold text-[#31332c] outline-none transition focus:border-[#ffdcbd] focus:ring-2 focus:ring-[#ffdcbd]/40"
            defaultValue={dashboard.filters.surface}
            name="surface"
          >
            <option value="">Toate</option>
            <option value="public">Public</option>
            <option value="account">Account</option>
            <option value="admin">Admin</option>
            <option value="system">System</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
            Result
          </span>
          <select
            className="h-12 w-full rounded-2xl border border-[#d8d5cc] bg-[#fbf9f4] px-4 text-sm font-semibold text-[#31332c] outline-none transition focus:border-[#ffdcbd] focus:ring-2 focus:ring-[#ffdcbd]/40"
            defaultValue={dashboard.filters.result}
            name="result"
          >
            <option value="">Toate</option>
            <option value="allowed">Allowed</option>
            <option value="blocked">Blocked</option>
            <option value="failed">Failed</option>
            <option value="succeeded">Succeeded</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
            Action prefix
          </span>
          <input
            className="h-12 w-full rounded-2xl border border-[#d8d5cc] bg-[#fbf9f4] px-4 text-sm font-semibold text-[#31332c] outline-none transition focus:border-[#ffdcbd] focus:ring-2 focus:ring-[#ffdcbd]/40"
            defaultValue={dashboard.filters.action}
            name="action"
            placeholder="auth. / webhook. / admin."
            type="text"
          />
        </label>

        <input name="range" type="hidden" value={dashboard.filters.range} />

        <button
          className="inline-flex h-12 items-center justify-center rounded-full bg-[#31332c] px-5 text-sm font-bold text-[#fff7f3] transition hover:bg-[#0e0e0c]"
          type="submit"
        >
          Aplică
        </button>

        <Link
          className="inline-flex h-12 items-center justify-center rounded-full border border-[#d8d5cc] px-5 text-sm font-bold text-[#31332c] transition hover:bg-[#f5f4ed]"
          href="/admin/security"
        >
          Reset
        </Link>
      </form>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.summaryCards.map((card) => (
          <article
            className="rounded-[1.75rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.04)]"
            key={card.label}
          >
            <div className={`inline-flex rounded-2xl p-3 ${getSummaryToneClass(card.tone)}`}>
              <SecuritySummaryIcon tone={card.tone} />
            </div>
            <p className="mt-5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
              {card.label}
            </p>
            <p className="mt-3 font-serif text-5xl leading-none text-[#31332c]">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
        <article className="rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.04)] md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
                Evenimente recente
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[#31332c]">Feed securitate</h2>
            </div>
            <span className="text-sm font-semibold text-[#5e6058]">
              {dashboard.totalMatchingEvents} evenimente în filtru
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#ece7de]">
            <table className="min-w-full divide-y divide-[#ece7de] text-left">
              <thead className="bg-[#fbf9f4]">
                <tr>
                  <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#797c73]">
                    Timp
                  </th>
                  <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#797c73]">
                    Surface
                  </th>
                  <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#797c73]">
                    Action
                  </th>
                  <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#797c73]">
                    Result
                  </th>
                  <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#797c73]">
                    Context
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ede7] bg-white">
                {dashboard.recentEvents.length ? (
                  dashboard.recentEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-4 py-4 text-sm font-semibold text-[#31332c]">
                        {formatDateTime(event.created_at)}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#5e6058]">{event.surface}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#31332c]">
                        {event.action}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${getResultTone(event.result)}`}
                        >
                          {event.result}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs leading-6 text-[#5e6058]">
                        <div>{event.entity_type ?? "N/A"}</div>
                        <div>{event.entity_id ?? "N/A"}</div>
                        <div className="mt-1 text-[#8f887a]">{summarizeMetadata(event.metadata)}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-sm font-semibold text-[#5e6058]" colSpan={5}>
                      Nu există evenimente pentru filtrul selectat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.04)]">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
              Grupări utile
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#31332c]">Patterns</h2>
            <div className="mt-6 space-y-3">
              {dashboard.actionGroups.length ? (
                dashboard.actionGroups.map((group) => (
                  <div
                    className="flex items-center justify-between rounded-[1.25rem] bg-[#f5f4ed] px-4 py-3"
                    key={group.label}
                  >
                    <span className="text-sm font-semibold text-[#31332c]">{group.label}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#735a42]">
                      {group.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-[#5e6058]">Nu există grupări pentru filtrul curent.</p>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.04)]">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
              Rate-limit
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#31332c]">Endpoint-uri sensibile</h2>
            <div className="mt-6 space-y-3">
              {rateLimitGroups.length ? (
                rateLimitGroups.map((group) => (
                  <div
                    className="flex items-center justify-between rounded-[1.25rem] bg-[#fff7e8] px-4 py-3"
                    key={group.endpointKey}
                  >
                    <span className="text-sm font-semibold text-[#31332c]">{group.endpointKey}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6535]">
                      {group.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-[#5e6058]">Nu există hit-uri recente de rate limit.</p>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.04)]">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#797c73]">
              Calendar sync
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#31332c]">Programări cu retry</h2>
            <div className="mt-6 space-y-3">
              {dashboard.calendarSyncIssues.length ? (
                dashboard.calendarSyncIssues.map((issue) => (
                  <div className="rounded-[1.25rem] bg-[#eef8f5] px-4 py-3" key={issue.id}>
                    <p className="text-sm font-semibold text-[#31332c]">
                      {issue.sync_status} · {formatDateTime(issue.start_at)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#5e6058]">
                      Appointment: {issue.id}
                    </p>
                    {issue.sync_error ? (
                      <p className="mt-1 text-xs leading-5 text-[#2d6a57]">{issue.sync_error}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-[#5e6058]">Nu există programări cu sync failed / needs_retry în interval.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
