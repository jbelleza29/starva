/** Formatting helpers for activity metrics. Pure + unit-testable. */

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(km >= 100 ? 0 : 1)} km`;
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters).toLocaleString("en-US")} m`;
}

/** Pace in seconds/km → "mm:ss /km". Returns "—" for non-distance activities. */
export function formatPace(distanceM: number, movingTimeS: number): string {
  if (distanceM < 100) return "—";
  const secPerKm = movingTimeS / (distanceM / 1000);
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

/** ISO date (YYYY-MM-DD) -> short label like "Apr 7". */
export function formatWeekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
