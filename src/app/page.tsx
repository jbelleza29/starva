"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { gql } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { ActivityFilter } from "@/components/dashboard/ActivityFilter";
import { DonutChart } from "@/components/dashboard/DonutChart";
import type { DonutChartDataItem } from "@/components/dashboard/DonutChart";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatWeekLabel,
} from "@/lib/format";

// Static query — no filter variables. Drives everything except the trend chart.
const DASHBOARD_QUERY = gql`
  query Dashboard {
    stravaConnected
    activityTypes
    activityTypeBreakdown {
      type
      count
      distance
      movingTime
    }
    summary {
      totalDistance
      totalMovingTime
      activityCount
      totalElevationGain
    }
  }
`;

// Isolated query owned by TrendSection — re-runs only when the filter changes.
const TREND_QUERY = gql`
  query TrendLoad($type: String) {
    weeklyTrainingLoad(weeks: 12, type: $type) {
      weekStart
      distance
    }
  }
`;

interface DashboardData {
  stravaConnected: boolean;
  activityTypes: string[];
  activityTypeBreakdown: DonutChartDataItem[];
  summary: {
    totalDistance: number;
    totalMovingTime: number;
    activityCount: number;
    totalElevationGain: number;
  };
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

  const client = useApolloClient();
  const { data, loading, error } = useQuery<DashboardData>(DASHBOARD_QUERY);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setSyncMsg(`Synced ${json.synced} activities.`);
        // Refetch all active queries — both Dashboard and TrendLoad.
        await client.refetchQueries({ include: "active" });
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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Starva</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Training load over the last 12 weeks, from your Strava activities.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {connected ? (
            <button
              onClick={handleSync}
              disabled={syncing}
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
          )}
          {syncMsg ? <p className="text-xs text-neutral-500">{syncMsg}</p> : null}
        </div>
      </header>

      {stravaStatus === "connected" ? (
        <Banner variant="success">Connected to Strava — click Sync to load your activities.</Banner>
      ) : stravaStatus === "denied" ? (
        <Banner variant="error">Strava authorization was denied.</Banner>
      ) : stravaStatus === "error" ? (
        <Banner variant="error">Something went wrong connecting to Strava. Try again.</Banner>
      ) : null}

      {loading && !data ? <DashboardSkeleton /> : null}

      {error ? (
        <Banner variant="error">Couldn&apos;t load your training data: {error.message}</Banner>
      ) : null}

      {data ? <Dashboard data={data} /> : null}
    </main>
  );
}

function Dashboard({ data }: { data: DashboardData }) {
  const { summary, activityTypeBreakdown, activityTypes } = data;

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

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-medium text-neutral-500">Activity breakdown</h2>
          <DonutChart data={activityTypeBreakdown} />
        </section>

        {/* TrendSection owns its own state + query — changing the filter only re-renders this panel. */}
        <TrendSection types={activityTypes} />
      </div>
    </div>
  );
}

// Isolated component: owns selectedType state and the TREND_QUERY.
// Nothing outside this subtree re-renders when the filter changes.
function TrendSection({ types }: { types: string[] }) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data } = useQuery<{
    weeklyTrainingLoad: { weekStart: string; distance: number }[];
  }>(TREND_QUERY, {
    variables: { type: selectedType },
  });

  const trend = (data?.weeklyTrainingLoad ?? []).map((week) => ({
    label: formatWeekLabel(week.weekStart),
    value: Math.round(week.distance / 100) / 10,
  }));

  const label = selectedType ? `Weekly distance · ${selectedType}` : "Weekly distance";

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 md:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">{label}</h2>
        <ActivityFilter types={types} value={selectedType} onChange={setSelectedType} />
      </div>
      <TrendChart data={trend} unit=" km" />
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
