"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatDistance } from "@/lib/format";
import { getActivityIcon } from "./ActivityFilter";

const TYPE_COLORS: Record<string, string> = {
  Run: "#f97316",
  Ride: "#3b82f6",
  Swim: "#06b6d4",
  Walk: "#22c55e",
  Hike: "#f59e0b",
  WeightTraining: "#8b5cf6",
  Workout: "#ec4899",
  Yoga: "#14b8a6",
  EBikeRide: "#84cc16",
  VirtualRide: "#64748b",
  VirtualRun: "#94a3b8",
};

const FALLBACK_COLORS = [
  "#f97316", "#3b82f6", "#06b6d4", "#22c55e",
  "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6",
];

function typeColor(type: string, index: number): string {
  return TYPE_COLORS[type] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export interface DonutChartDataItem {
  type: string;
  count: number;
  distance: number;
}

export interface DonutChartProps {
  data: DonutChartDataItem[];
}

/**
 * Donut chart showing the breakdown of activities by type (distance-weighted).
 * Part of the reusable dashboard component kit.
 */
export function DonutChart({ data }: DonutChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="distance"
            nameKey="type"
            innerRadius="52%"
            outerRadius="72%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.type} fill={typeColor(entry.type, index)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              formatDistance(Number(value)),
              `${getActivityIcon(String(name))} ${String(name)}`,
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => `${getActivityIcon(value)} ${value}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
