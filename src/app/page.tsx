"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { ActivityFilter } from "@/components/dashboard/ActivityFilter";
import { getActivityIcon, formatActivityType } from "@/lib/activityIcons";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { HeatmapChart } from "@/components/dashboard/HeatmapChart";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatWeekLabel,
  currentMonthKey,
} from "@/lib/format";
import { useDashboardQuery, useTrendQuery, useTrendByTypeQuery, useActivitiesQuery } from "@/lib/queries";
import { typeColor } from "@/lib/activityColors";
import type { DashboardData } from "@/lib/queries";
import { ActivitiesGrid } from "@/components/dashboard/ActivitiesGrid";
import { useSyncStore, FREE_SYNCS } from "@/lib/store/syncStore";

function fmtCountdown(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Home() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  const stravaStatus = searchParams.get("strava") as "connected" | "denied" | "error" | null;

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const { count, lastSyncAt, cooldownMs, recordSync } = useSyncStore();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useDashboardQuery();

  useEffect(() => {
    if (cooldownMs === 0) return;
    const compute = () => Math.max(0, cooldownMs - (Date.now() - lastSyncAt));
    const init = setTimeout(() => setRemainingMs(compute()), 0);
    const id = setInterval(() => setRemainingMs(compute()), 1000);
    return () => { clearTimeout(init); clearInterval(id); };
  }, [cooldownMs, lastSyncAt]);

  const canSync = count < FREE_SYNCS || remainingMs === 0;

  async function handleSync() {
    if (!canSync || syncing) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setSyncMsg(`Synced ${json.synced} activities.`);
        recordSync();
        await queryClient.invalidateQueries();
      } else {
        setSyncMsg(`Sync failed: ${json.error}`);
      }
    } catch {
      setSyncMsg("Network error — sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  const connected = data?.stravaConnected ?? false;
  const allowSync = process.env.NEXT_PUBLIC_ALLOW_SYNC === "true";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      {!allowSync && (
        <div className="mb-6 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
          <p className="text-sm font-medium">You&apos;re viewing John&apos;s real training data.</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Multi-user support is in progress — you&apos;ll soon be able to connect your
            own Strava and see your data here.
          </p>
        </div>
      )}

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Starva</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {allowSync
              ? "Training load over the last 12 weeks, from your Strava activities."
              : "John's training load over the last 12 weeks."}
          </p>
          {data?.lastActivityAt ? (
            <p className="mt-0.5 text-xs text-neutral-400">
              Data through{" "}
              {new Date(data.lastActivityAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {allowSync && (connected ? (
            <button
              onClick={handleSync}
              disabled={syncing || !canSync}
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Sync Strava"}
            </button>
          ) : (
            <a
              href="/api/strava/connect"
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              Connect Strava
            </a>
          ))}
          {remainingMs > 0 ? (
            <p className="text-xs text-neutral-400">Next sync in {fmtCountdown(remainingMs)}</p>
          ) : syncMsg ? (
            <p className="text-xs text-neutral-500">{syncMsg}</p>
          ) : null}
        </div>
      </header>

      {stravaStatus === "connected" ? (
        <Banner variant="success">Connected to Strava — click Sync to load your activities.</Banner>
      ) : stravaStatus === "denied" ? (
        <Banner variant="error">Strava authorization was denied.</Banner>
      ) : stravaStatus === "error" ? (
        <Banner variant="error">Something went wrong connecting to Strava. Try again.</Banner>
      ) : null}

      {isLoading ? <DashboardSkeleton /> : null}

      {error ? (
        <Banner variant="error">Couldn&apos;t load your training data: {error.message}</Banner>
      ) : null}

      {data ? <Dashboard data={data} /> : null}
    </main>
  );
}

function weekDeltaSublabel(
  current: number,
  avg: number,
): { text: string; tone?: "positive" | "negative" } | undefined {
  if (current === 0) return { text: "No activity logged yet this week" };
  if (avg <= 0) return undefined;
  const pct = Math.round(((current - avg) / avg) * 100);
  return {
    text: `${pct >= 0 ? "+" : ""}${pct}% vs avg week`,
    tone: pct >= 0 ? "positive" : "negative",
  };
}

function Dashboard({ data }: { data: DashboardData }) {
  const { summary, activityTypeBreakdown, activityTypes, dailyHeatmap, highlights, longestPerType, goals } = data;
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const weekDelta = weekDeltaSublabel(highlights.currentWeekDistance, highlights.avgWeekDistance);
  const activeGoals = goals.filter((goal) => goal.month === currentMonthKey());
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  if (summary.activityCount === 0) {
    return (
      <p className="rounded-xl border border-black/10 bg-white p-8 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900">
        No activities yet. Connect Strava and sync to see your training data.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total distance" value={formatDistance(summary.totalDistance)} />
        <KpiCard label="Moving time" value={formatDuration(summary.totalMovingTime)} />
        <KpiCard label="Activities" value={String(summary.activityCount)} />
        <KpiCard label="Elevation gain" value={formatElevation(summary.totalElevationGain)} />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <KpiCard
          label="Best week"
          value={formatDistance(highlights.bestWeekDistance)}
          sublabel={highlights.bestWeekStart ? `w/o ${formatWeekLabel(highlights.bestWeekStart)}` : undefined}
        />
        <KpiCard
          label="This week"
          value={formatDistance(highlights.currentWeekDistance)}
          sublabel={weekDelta?.text}
          sublabelTone={weekDelta?.tone}
        />
      </section>

      {longestPerType.length > 0 && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {longestPerType
            .filter((p) => activityTypeBreakdown.some((b) => b.type === p.type))
            .sort((a, b) => {
              const ai = activityTypeBreakdown.findIndex((x) => x.type === a.type);
              const bi = activityTypeBreakdown.findIndex((x) => x.type === b.type);
              return ai - bi;
            })
            .slice(0, 4)
            .map((peak) => (
              <KpiCard
                key={peak.type}
                href={`/activities/${peak.id}`}
                label={`${getActivityIcon(peak.type)} Longest ${formatActivityType(peak.type)}`}
                value={peak.distance > 100 ? formatDistance(peak.distance) : formatDuration(peak.movingTime)}
                sublabel={peak.name}
              />
            ))}
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-medium text-neutral-500">Activity breakdown</h2>
          <DonutChart data={activityTypeBreakdown} />
        </section>

        <TrendSection types={activityTypes} value={selectedType} onChange={setSelectedType} />
      </div>

      <RecentActivitiesSection type={selectedType} />

      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-medium text-neutral-500">Training consistency</h2>
        <HeatmapChart data={dailyHeatmap} />
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Goals · {monthName}</h2>
          <Link href="/goals" className="text-xs text-orange-500 hover:underline">
            Manage goals →
          </Link>
        </div>
        {activeGoals.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No goals set for {monthName} yet —{" "}
            <Link href="/goals" className="text-orange-500 hover:underline">
              set one
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => {
              const pct = Math.min(Math.round((goal.progress / goal.target) * 100), 100);
              const done = pct >= 100;
              const valueLabel =
                goal.metric === "distance"
                  ? formatDistance(goal.progress)
                  : formatDuration(goal.progress);
              const targetLabel =
                goal.metric === "distance"
                  ? formatDistance(goal.target)
                  : formatDuration(goal.target);
              return (
                <div key={goal.id} className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                  <p className="text-xs font-medium">
                    {getActivityIcon(goal.activityType)}{" "}
                    {goal.activityType === "All" ? "All activities" : goal.activityType}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {valueLabel} / {targetLabel}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className={`h-full rounded-full ${done ? "bg-green-500" : "bg-orange-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-neutral-400">{pct}%</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const TREND_WINDOW_WEEKS = 12;
// Monday (UTC) starting the 12-week window — same math as dashboardWindowStart
// server-side, so the grid count matches the KPIs. Snapshotted at module load;
// render-time Date.now() trips react-hooks/purity.
const TREND_CUTOFF_MS = (() => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) - (TREND_WINDOW_WEEKS - 1) * 7);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
})();

function TrendSection({
  types,
  value,
  onChange,
}: {
  types: string[];
  value: string | null;
  onChange: (type: string | null) => void;
}) {
  const { data: singleData } = useTrendQuery(value, value !== null);
  const { data: byTypeData } = useTrendByTypeQuery(value === null);

  const toPoints = (weeks: { weekStart: string; movingTime: number }[]) =>
    weeks.map((week) => ({
      label: formatWeekLabel(week.weekStart),
      value: Math.round(week.movingTime / 360) / 10,
    }));

  const series = value
    ? [{ name: value, data: toPoints(singleData?.weeklyTrainingLoad ?? []) }]
    : (byTypeData?.weeklyTrainingLoadByType ?? [])
        // Hide types with under an hour in the window — single-session noise.
        .filter((t) => t.series.reduce((sum, week) => sum + week.movingTime, 0) >= 3600)
        .map((t, index) => ({
          name: t.type,
          color: typeColor(t.type, index),
          data: toPoints(t.series),
        }));

  const label = value ? `Weekly hours · ${value}` : "Weekly hours by activity";

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 md:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">{label}</h2>
        <ActivityFilter types={types} value={value} onChange={onChange} />
      </div>
      <TrendChart series={series} unit=" h" />
    </section>
  );
}

/** The activities behind the trend chart — same 12-week window, same type filter. */
function RecentActivitiesSection({ type }: { type: string | null }) {
  const { data, isLoading } = useActivitiesQuery();

  const rows = (data?.activities ?? []).filter(
    (a) => new Date(a.startDate).getTime() >= TREND_CUTOFF_MS && (!type || a.type === type),
  );

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">
          Activities · last 12 weeks{type ? ` · ${type}` : ""}
        </h2>
        <Link href="/activities" className="text-xs text-orange-500 hover:underline">
          All activities →
        </Link>
      </div>
      <ActivitiesGrid rows={rows} loading={isLoading} pageSize={10} />
    </section>
  );
}

function Banner({
  variant,
  children,
}: {
  variant: "success" | "error";
  children: React.ReactNode;
}) {
  const styles =
    variant === "success"
      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300"
      : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
  return <div className={`mb-6 rounded-xl border p-4 text-sm ${styles}`}>{children}</div>;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900"
          />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900" />
        <div className="h-64 animate-pulse rounded-xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900 md:col-span-2" />
      </div>
    </div>
  );
}
