"use client";

import { useRef, useState } from "react";
import { formatDuration } from "@/lib/format";

export interface HeatmapDay {
  date: string;       // YYYY-MM-DD
  movingTime: number; // seconds
}

export interface HeatmapChartProps {
  data: HeatmapDay[];
  weeks?: number;
}

const CELL = 13;         // fixed px — ensures day labels and cells share the same row height
const GAP = 3;           // gap between cells
const DAY_COL = 28;      // width of the day-label column
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function intensityClass(seconds: number): string {
  if (seconds === 0) return "bg-neutral-100 dark:bg-neutral-800";
  if (seconds < 1800)  return "bg-orange-200 dark:bg-orange-900/60";
  if (seconds < 3600)  return "bg-orange-300 dark:bg-orange-700/70";
  if (seconds < 7200)  return "bg-orange-400 dark:bg-orange-500";
  return "bg-orange-500";
}

/**
 * GitHub-style activity heatmap. One cell per day, coloured by moving time.
 * Cells are fixed CELL×CELL px; columns are distributed via justify-between
 * so the grid fills the full panel width. Part of the dashboard component kit.
 */
export function HeatmapChart({ data, weeks = 52 }: HeatmapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const dataMap = new Map(data.map((d) => [d.date, d.movingTime]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7);
  start.setDate(start.getDate() - start.getDay()); // snap to Sunday

  // Build week columns.
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

  // Month labels: one per month-start column; always label column 0.
  const monthLabels = new Map<number, string>();
  columns.forEach((week, ci) => {
    const hit = week.find((d) => d.date.getDate() === 1);
    if (hit) monthLabels.set(ci, hit.date.toLocaleString("en-US", { month: "short" }));
  });
  if (columns.length > 0 && !monthLabels.has(0)) {
    monthLabels.set(0, columns[0][0].date.toLocaleString("en-US", { month: "short" }));
  }

  function handleEnter(e: React.MouseEvent, date: Date, mt: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cRect = containerRef.current?.getBoundingClientRect();
    const label = date.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    setTooltip({
      text: mt > 0 ? `${label} · ${formatDuration(mt)}` : `${label} · No activity`,
      x: rect.left - (cRect?.left ?? 0) + rect.width / 2,
      y: rect.top  - (cRect?.top  ?? 0) - 4,
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* min-width keeps cells legible on narrow viewports; parent clips+scrolls */}
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: 560 }}>

          {/* ── Month labels ─────────────────────────────────────────────── */}
          {/* Same structure as the cell row (spacer + justify-between flex)  */}
          {/* so labels align with their week column.                          */}
          <div className="mb-1 flex">
            <div style={{ width: DAY_COL, flexShrink: 0 }} />
            <div className="flex flex-1 justify-between">
              {columns.map((_, ci) => (
                <div
                  key={ci}
                  style={{ width: CELL }}
                  className="overflow-visible whitespace-nowrap text-xs text-neutral-400"
                >
                  {monthLabels.get(ci) ?? ""}
                </div>
              ))}
            </div>
          </div>

          {/* ── Cell grid ────────────────────────────────────────────────── */}
          <div className="flex">
            {/* Day-of-week labels — same CELL height as grid cells */}
            <div
              className="flex shrink-0 flex-col items-end pr-1"
              style={{ width: DAY_COL, rowGap: GAP }}
            >
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  style={{ height: CELL, lineHeight: `${CELL}px` }}
                  className="text-xs text-neutral-400"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Week columns — justify-between fills full width */}
            <div className="flex flex-1 justify-between">
              {columns.map((week, ci) => (
                <div key={ci} className="flex flex-col" style={{ rowGap: GAP }}>
                  {week.map(({ iso, date }) => {
                    const mt = dataMap.get(iso) ?? 0;
                    const future = date > today;
                    return (
                      <div
                        key={iso}
                        style={{ width: CELL, height: CELL }}
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
