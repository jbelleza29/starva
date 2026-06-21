"use client";

import { useRef, useState } from "react";
import { formatDuration } from "@/lib/format";

export interface HeatmapDay {
  date: string;       // YYYY-MM-DD
  movingTime: number; // seconds
}

export interface HeatmapChartProps {
  data: HeatmapDay[];
  /** Number of weeks to display. Default 52 (full year). */
  weeks?: number;
}

const GAP = 3; // px gap between cells

function intensityClass(seconds: number): string {
  if (seconds === 0) return "bg-neutral-100 dark:bg-neutral-800";
  if (seconds < 1800) return "bg-orange-200 dark:bg-orange-900/60";
  if (seconds < 3600) return "bg-orange-300 dark:bg-orange-700/70";
  if (seconds < 7200) return "bg-orange-400 dark:bg-orange-500";
  return "bg-orange-500";
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

/**
 * GitHub-style activity heatmap. One cell per day, coloured by moving time.
 * Uses CSS Grid with 1fr columns so it fills the full panel width.
 * Part of the reusable dashboard kit.
 */
export function HeatmapChart({ data, weeks = 52 }: HeatmapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const dataMap = new Map(data.map((d) => [d.date, d.movingTime]));

  // Snap start to the Sunday that's ~52 weeks ago.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7);
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  // Build week columns (each = 7 days, Sun→Sat).
  const columns: { iso: string; date: Date }[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: { iso: string; date: Date }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({ iso: cursor.toISOString().slice(0, 10), date: new Date(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(week);
  }

  // Month labels: label the column that contains the 1st of each month.
  // Also always label column 0 so the partial start month is named.
  const monthLabels = new Map<number, string>();
  columns.forEach((week, ci) => {
    const hit = week.find((d) => d.date.getDate() === 1);
    if (hit) monthLabels.set(ci, hit.date.toLocaleString("en-US", { month: "short" }));
  });
  if (columns.length > 0 && !monthLabels.has(0)) {
    monthLabels.set(
      0,
      columns[0][0].date.toLocaleString("en-US", { month: "short" }),
    );
  }

  const N = columns.length;
  // Shared CSS grid: 28px day-label column + N equal week columns.
  const gridCols = `28px repeat(${N}, 1fr)`;

  function handleEnter(e: React.MouseEvent, date: Date, mt: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cRect = containerRef.current?.getBoundingClientRect();
    const label = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    setTooltip({
      text: mt > 0 ? `${label} · ${formatDuration(mt)}` : `${label} · No activity`,
      x: rect.left - (cRect?.left ?? 0) + rect.width / 2,
      y: rect.top - (cRect?.top ?? 0) - 4,
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* min-width so cells stay legible on narrow viewports; parent scrolls. */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 560 }}>

          {/* Month labels row */}
          <div
            className="mb-1"
            style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: GAP }}
          >
            <div /> {/* spacer over day-label column */}
            {columns.map((_, ci) => (
              <div key={ci} className="text-xs text-neutral-400 truncate">
                {monthLabels.get(ci) ?? ""}
              </div>
            ))}
          </div>

          {/* Day labels + cell grid */}
          <div
            style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: GAP }}
          >
            {/* Day-of-week labels */}
            <div className="flex flex-col" style={{ rowGap: GAP }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="flex items-center justify-end pr-1 text-xs text-neutral-400"
                  style={{ aspectRatio: "1" }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* One column per week */}
            {columns.map((week, ci) => (
              <div key={ci} className="flex flex-col" style={{ rowGap: GAP }}>
                {week.map(({ iso, date }) => {
                  const mt = dataMap.get(iso) ?? 0;
                  const future = date > today;
                  return (
                    <div
                      key={iso}
                      style={{ aspectRatio: "1" }}
                      className={`rounded-sm ${
                        future
                          ? "opacity-0 pointer-events-none"
                          : intensityClass(mt)
                      }`}
                      onMouseEnter={(e) => !future && handleEnter(e, date, mt)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-white dark:text-neutral-900"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      ) : null}
    </div>
  );
}
