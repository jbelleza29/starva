"use client";

import Highcharts from "highcharts/esm/highcharts.js";
import "highcharts/esm/modules/accessibility.js";
import HighchartsReact from "highcharts-react-official";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface TrendSeries {
  name: string;
  /** Line color; defaults to the accent orange for single-series charts. */
  color?: string;
  data: TrendPoint[];
}

export interface TrendChartProps {
  series: TrendSeries[];
  /** Suffix appended to values in the tooltip, e.g. " km". */
  unit?: string;
  /** Set to false to disable the mount animation — used for deterministic visual snapshots. */
  animate?: boolean;
}

// Neutral gray that stays readable in both light and dark mode.
const LABEL_COLOR = "#9ca3af";
const DEFAULT_COLOR = "#f97316";

/**
 * Reusable trend chart. One series renders as a gradient-filled area; multiple
 * series render as compared lines with a legend and shared tooltip. Wraps
 * Highcharts behind our own prop API so the charting engine stays swappable
 * without touching call sites. Part of the dashboard component kit.
 */
export function TrendChart({ series, unit = "", animate = true }: TrendChartProps) {
  const isMulti = series.length > 1;
  const categories = (series[0]?.data ?? []).map((p) => p.label);

  const options: Highcharts.Options = {
    chart: { backgroundColor: "transparent", height: 256, spacing: [8, 8, 4, 4] },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { description: "Weekly training distance trend" },
    legend: {
      enabled: isMulti,
      itemStyle: { fontSize: "12px", fontWeight: "400", color: LABEL_COLOR },
      itemHoverStyle: { color: "#737373" },
      symbolWidth: 20,
      itemMarginBottom: 2,
      alignColumns: false,
    },
    xAxis: {
      categories,
      lineWidth: 0,
      tickWidth: 0,
      labels: { style: { fontSize: "12px", color: LABEL_COLOR } },
    },
    yAxis: {
      title: { text: undefined },
      min: 0,
      gridLineDashStyle: "Dash",
      gridLineColor: "rgba(115, 115, 115, 0.15)",
      labels: { style: { fontSize: "12px", color: LABEL_COLOR } },
    },
    tooltip: { valueSuffix: unit, shared: isMulti },
    plotOptions: {
      series: { animation: animate, marker: { enabled: false } },
    },
    series: series.map((s) =>
      isMulti
        ? {
            type: "spline" as const,
            name: s.name,
            data: s.data.map((p) => p.value),
            color: s.color,
            lineWidth: 2,
          }
        : {
            type: "areaspline" as const,
            name: s.name,
            data: s.data.map((p) => p.value),
            color: s.color ?? DEFAULT_COLOR,
            lineWidth: 2,
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, Highcharts.color(s.color ?? DEFAULT_COLOR).setOpacity(0.35).get("rgba") as string],
                [1, Highcharts.color(s.color ?? DEFAULT_COLOR).setOpacity(0).get("rgba") as string],
              ] as [number, string][],
            },
          },
    ),
  };

  return (
    <div className="w-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
