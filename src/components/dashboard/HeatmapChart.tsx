"use client";

import { useRef, useState } from "react";
import { formatDuration } from "@/lib/format";

export interface HeatmapDay {
  date: string;      // YYYY-MM-DD
  movingTime: number; // seconds
}

export interface HeatmapChartProps {
  data: HeatmapDay[];
  /** Number of weeks to display. Default 52 (full year). */
  weeks?: number;
}

const CELL = 12; // cell size px
const GAP = 3;   // gap between cells px
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function intensityClass(seconds: number): string {
  if (seconds === 0) return "bg-neutral-100 dark:bg-neutral-800";
  if (seconds < 1800) return "bg-orange-200 dark:bg-orange-900/60";
  if (seconds < 3600) return "bg-orange-300 dark:bg-orange-700/70";
  if (seconds < 7200) return "bg-orange-400 dark:bg-orange-500";
  return "bg-orange-500";
}

/**
 * GitHub-style activity heatmap. One cell per day coloured by moving time.
 * Pure CSS/React — no charting library. Part of the reusable dashboard kit.
 */
export function HeatmapChart({ data, weeks = 52 }: HeatmapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const dataMap = new Map(data.map((d) => [d.date, d.movingTime]));

  // Build the grid: snap start to the Sunday that's ~52 weeks ago.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7);
  start.setDate(start.getDate() - start.getDay()); // snap to Sunday

  // Build columns (each column = one week, 7 days top→bottom Sun→Sat)
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

  // Month labels: mark the column that contains the 1st of each month.
  const monthLabels = new Map<number, string>();
  columns.forEach((week, ci) => {
    const hit = week.find((d) => d.date.getDate() === 1);
    if (hit) {
      monthLabels.set(ci, hit.date.toLocaleString("en-US", { month: "short" }));
    }
  });

  function handleEnter(e: React.MouseEvent, iso: string, date: Date, mt: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const dateLabel = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    setTooltip({
      text: mt > 0 ? `${dateLabel} · ${formatDuration(mt)}` : `${dateLabel} · No activity`,
      x: rect.left - (containerRect?.left ?? 0) + CELL / 2,
      y: rect.top - (containerRect?.top ?? 0) - 4,
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col" style={{ gap: 4 }}>

          {/* Month labels */}
          <div className="flex" style={{ marginLeft: 28 }}>
            {columns.map((_, ci) => (
              <div
                key={ci}
                style={{ width: CELL + GAP, flexShrink: 0 }}
                className="text-xs text-neutral-400"
              >
                {monthLabels.get(ci) ?? ""}
              </div>
            ))}
          </div>

          {/* Day labels + cell grid */}
          <div className="flex">
            {/* Day-of-week labels */}
            <div className="flex flex-col justify-between" style={{ width: 24, gap: GAP, marginRight: 4 }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  style={{ height: CELL, lineHeight: `${CELL}px` }}
                  className="text-right text-xs text-neutral-400"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {columns.map((week, ci) => (
              <div key={ci} className="flex flex-col" style={{ gap: GAP, marginRight: GAP }}>
                {week.map(({ iso, date }) => {
                  const mt = dataMap.get(iso) ?? 0;
                  const future = date > today;
                  return (
                    <div
                      key={iso}
                      style={{ width: CELL, height: CELL }}
                      className={`rounded-sm ${future ? "opacity-0 pointer-events-none" : intensityClass(mt)}`}
                      onMouseEnter={(e) => !future && handleEnter(e, iso, date, mt)}
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
