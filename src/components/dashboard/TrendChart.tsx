"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface TrendChartProps {
  data: TrendPoint[];
  /** Suffix appended to values in the tooltip, e.g. " km". */
  unit?: string;
  /** Accent color. */
  color?: string;
  /** Set to false to disable the mount animation — used for deterministic visual snapshots. */
  animate?: boolean;
}

/**
 * Reusable area trend chart. Wraps Recharts behind our own prop API so the
 * charting engine stays swappable (Recharts now, Visx later) without touching
 * call sites. Part of the dashboard component kit.
 */
export function TrendChart({
  data,
  unit = "",
  color = "#f97316",
  animate = true,
}: TrendChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip formatter={(value) => `${value}${unit}`} isAnimationActive={false} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#trendFill)"
            isAnimationActive={animate}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
