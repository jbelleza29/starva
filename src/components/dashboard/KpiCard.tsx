import Link from "next/link";
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
  /** If provided, the card becomes a Next.js Link with an arrow indicator. */
  href?: string;
}

/**
 * A single KPI tile. Part of the reusable dashboard component kit — presentational
 * only (no data fetching), fully driven by props so it's trivial to document in
 * Storybook and snapshot with Chromatic.
 */
export function KpiCard({ label, value, sublabel, icon, href }: KpiCardProps) {
  const content = (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        {href ? (
          <span className="text-xs text-neutral-400">↗</span>
        ) : icon ? (
          <span className="text-neutral-400">{icon}</span>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {sublabel ? <p className="mt-1 text-xs text-neutral-400">{sublabel}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        {content}
      </Link>
    );
  }

  return content;
}
