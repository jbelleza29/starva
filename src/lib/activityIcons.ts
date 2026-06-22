/** Pure activity icon/label helpers — no "use client", safe to import from Server Components. */

export const ACTIVITY_ICONS: Record<string, string> = {
  Run: "🏃",
  Ride: "🚴",
  Swim: "🏊",
  Walk: "🚶",
  Hike: "🥾",
  WeightTraining: "🏋️",
  Workout: "💪",
  Yoga: "🧘",
  EBikeRide: "⚡",
  VirtualRide: "💻",
  VirtualRun: "💻",
  AlpineSki: "⛷️",
  NordicSki: "🎿",
  Snowboard: "🏂",
  Kayaking: "🚣",
  Rowing: "🚣",
  RockClimbing: "🧗",
  IceSkate: "⛸️",
  Skateboard: "🛹",
};

export function getActivityIcon(type: string): string {
  return ACTIVITY_ICONS[type] ?? "🏅";
}

/** "WeightTraining" → "Weight Training", "EBikeRide" → "E Bike Ride". */
export function formatActivityType(type: string): string {
  return type
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}
