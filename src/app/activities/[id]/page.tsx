import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivityById } from "@/lib/activities";
import { getActivityIcon, formatActivityType } from "@/lib/activityIcons";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
} from "@/lib/format";

// Server Component — fetches data directly, no Apollo Client needed.
export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivityById(id);

  if (!activity) notFound();

  const date = new Date(activity.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const speedKmh = ((activity.averageSpeed ?? 0) * 3.6).toFixed(1);

  const stats: { label: string; value: string }[] = [
    { label: "Distance",       value: formatDistance(activity.distance) },
    { label: "Moving time",    value: formatDuration(activity.movingTime) },
    { label: "Elapsed time",   value: formatDuration(activity.elapsedTime) },
    { label: "Elevation gain", value: formatElevation(activity.totalElevationGain) },
    { label: "Pace",           value: formatPace(activity.distance, activity.movingTime) },
    { label: "Avg speed",      value: `${speedKmh} km/h` },
    ...(activity.averageHeartrate
      ? [{ label: "Avg heart rate", value: `${Math.round(activity.averageHeartrate)} bpm` }]
      : []),
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-orange-500"
      >
        ← Back to dashboard
      </Link>

      <div className="mt-6">
        <p className="text-sm text-neutral-500">
          {getActivityIcon(activity.type)} {formatActivityType(activity.type)} · {date}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{activity.name}</h1>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900"
          >
            <p className="text-sm font-medium text-neutral-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
