"use client";

import Highcharts from "highcharts/esm/highcharts.js";
import "highcharts/esm/modules/accessibility.js";
import HighchartsReact from "highcharts-react-official";
import { formatDuration } from "@/lib/format";
import { getActivityIcon } from "@/lib/activityIcons";
import { typeColor } from "@/lib/activityColors";

const TOP_TYPES = 5;
const OTHERS_COLOR = "#a3a3a3";

/** Keep the top 5 types by moving time, clump the rest into "Others". */
function topWithOthers(data: DonutChartDataItem[]): DonutChartDataItem[] {
  const sorted = [...data].sort((a, b) => b.movingTime - a.movingTime);
  if (sorted.length <= TOP_TYPES + 1) return sorted;
  const rest = sorted.slice(TOP_TYPES);
  return [
    ...sorted.slice(0, TOP_TYPES),
    {
      type: "Others",
      count: rest.reduce((sum, d) => sum + d.count, 0),
      distance: rest.reduce((sum, d) => sum + d.distance, 0),
      movingTime: rest.reduce((sum, d) => sum + d.movingTime, 0),
    },
  ];
}

export interface DonutChartDataItem {
  type: string;
  count: number;
  distance: number;
  movingTime: number;
}

export interface DonutChartProps {
  data: DonutChartDataItem[];
  /** Set to false to disable mount animation — used for deterministic Chromatic snapshots. */
  animate?: boolean;
}

/**
 * Donut chart showing the breakdown of activities by type (moving-time weighted).
 * Part of the reusable dashboard component kit.
 */
export function DonutChart({ data, animate = true }: DonutChartProps) {
  const slices = topWithOthers(data);

  const options: Highcharts.Options = {
    chart: { backgroundColor: "transparent", height: 280 },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { description: "Breakdown of moving time by activity type" },
    tooltip: {
      pointFormatter() {
        return `<b>${formatDuration(this.y ?? 0)}</b>`;
      },
    },
    legend: {
      itemStyle: { fontSize: "12px", fontWeight: "400", color: "#9ca3af" },
      itemHoverStyle: { color: "#737373" },
      symbolRadius: 4,
      symbolHeight: 8,
      itemMarginBottom: 2,
      alignColumns: false,
    },
    plotOptions: {
      pie: {
        innerSize: "62%",
        borderWidth: 2,
        borderColor: "transparent",
        dataLabels: { enabled: false },
        showInLegend: true,
        animation: animate,
      },
    },
    series: [
      {
        type: "pie",
        name: "Moving time",
        data: slices.map((item, index) => ({
          name: item.type === "Others" ? "Others" : `${getActivityIcon(item.type)} ${item.type}`,
          y: item.movingTime,
          color: item.type === "Others" ? OTHERS_COLOR : typeColor(item.type, index),
        })),
      },
    ],
  };

  return (
    <div className="w-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
