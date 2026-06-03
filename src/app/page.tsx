"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatWeekLabel,
} from "@/lib/format";

const DASHBOARD_QUERY = gql`
  query Dashboard {
    summary {
      totalDistance
      totalMovingTime
      activityCount
      totalElevationGain
    }
    weeklyTrainingLoad(weeks: 12) {
      weekStart
      distance
    }
  }
`;

interface DashboardData {
  summary: {
    totalDistance: number;
    totalMovingTime: number;
    activityCount: number;
    totalElevationGain: number;
  };
  weeklyTrainingLoad: {
    weekStart: string;
    distance: number;
  }[];
}

export default function Home() {
  const { data, loading, error } = useQuery<DashboardData>(DASHBOARD_QUERY);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Starva</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Training load over the last 12 weeks, from your Strava activities.
        </p>
      </header>

      {loading ? <DashboardSkeleton /> : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          Couldn&apos;t load your training data: {error.message}
        </p>
      ) : null}

      {data && !loading ? <Dashboard data={data} /> : null}
    </main>
  );
}

function Dashboard({ data }: { data: DashboardData }) {
  const { summary, weeklyTrainingLoad } = data;

  if (summary.activityCount === 0) {
    return (
      <p className="rounded-xl border border-black/10 bg-white p-8 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900">
        No activities yet. Connect Strava to start tracking your training load.
      </p>
    );
  }

  const trend = weeklyTrainingLoad.map((week) => ({
    label: formatWeekLabel(week.weekStart),
    value: Math.round(week.distance / 100) / 10, // meters -> km, 1 decimal
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total distance" value={formatDistance(summary.totalDistance)} />
        <KpiCard label="Moving time" value={formatDuration(summary.totalMovingTime)} />
        <KpiCard label="Activities" value={String(summary.activityCount)} />
        <KpiCard label="Elevation gain" value={formatElevation(summary.totalElevationGain)} />
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-medium text-neutral-500">Weekly distance</h2>
        <TrendChart data={trend} unit=" km" />
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900" />
    </div>
  );
}
