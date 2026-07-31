import Link from "next/link";
import type { ReactNode } from "react";

export interface KpiCardProps {
  /** Short metric name, e.g. "Total distance". */
  label: string;
  /** Pre-formatted value, e.g. "412 km". */
  value: string;
  /** Optional context line under the value. */
  sublabel?: string;
  /** Color treatment for the sublabel, e.g. a red negative delta. */
  sublabelTone?: "positive" | "negative";
  /** Optional leading glyph/icon. */
  icon?: ReactNode;
  /** If provided, the card becomes a Next.js Link with an arrow indicator. */
  href?: string;
}

/**
 * A single KPI tile. Part of the reusable dashboard component kit — presentational
 * only (no data fetching), fully driven by props so it's trivial to document in
 * Storybook and snapshot with Chromatic.
 */
export function KpiCard({ label, value, sublabel, sublabelTone, icon, href }: KpiCardProps) {
  const sublabelColor =
    sublabelTone === "positive"
      ? "text-green-600 dark:text-green-400"
      : sublabelTone === "negative"
        ? "text-red-500 dark:text-red-400"
        : "text-neutral-400";

  const content = (
    <div className="flex h-full flex-col rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        {href ? (
          <span className="text-xs text-neutral-400">↗</span>
        ) : icon ? (
          <span className="text-neutral-400">{icon}</span>
        ) : null}
      </div>
      {/* mt-auto pins value + sublabel to the bottom so values align across a
          row even when a long label wraps to two lines. */}
      <p className="mt-auto pt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {sublabel ? <p className={`mt-1 text-xs ${sublabelColor}`}>{sublabel}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-xl transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        {content}
      </Link>
    );
  }

  return content;
}
