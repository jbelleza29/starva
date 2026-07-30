"use client";

import { ActivitiesGrid } from "@/components/dashboard/ActivitiesGrid";
import { useActivitiesQuery } from "@/lib/queries";

export default function ActivitiesPage() {
  const { data, isLoading, error } = useActivitiesQuery();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Activities</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Every synced activity — sort, filter, and click through to the route map.
      </p>

      <section className="mt-8 rounded-xl border border-black/10 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        {error ? (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t load activities: {error.message}
          </p>
        ) : (
          <ActivitiesGrid
            rows={data?.activities ?? []}
            loading={isLoading}
            pageSize={25}
            showToolbar
          />
        )}
      </section>
    </main>
  );
}
