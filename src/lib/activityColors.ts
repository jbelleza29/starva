/** Shared activity-type color palette — keeps the donut and trend charts consistent. */

export const TYPE_COLORS: Record<string, string> = {
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

// Disjoint from TYPE_COLORS values so an unmapped type never shadows a mapped one.
export const FALLBACK_COLORS = [
  "#e11d48", "#0284c7", "#ca8a04", "#4d7c0f",
  "#0f766e", "#db2777", "#7e22ce", "#dc2626",
];

export function typeColor(type: string, index: number): string {
  return TYPE_COLORS[type] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}
