import type { ReactNode } from "react";

export interface KpiCardProps {
  /** Short metric name, e.g. "Total distance". */
  label: string;
  /** Pre-formatted value, e.g. "412 km". */
  value: string;
  /** Optional context line under the value. */
  sublabel?: string;
  /** Optional leading glyph/icon. */
  icon?: ReactNode;
}

/**
 * A single KPI tile. Part of the reusable dashboard component kit — presentational
 * only (no data fetching), fully driven by props so it's trivial to document in
 * Storybook and snapshot with Chromatic.
 */
export function KpiCard({ label, value, sublabel, icon }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        {icon ? <span className="text-neutral-400">{icon}</span> : null}
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {sublabel ? <p className="mt-1 text-xs text-neutral-400">{sublabel}</p> : null}
    </div>
  );
}
