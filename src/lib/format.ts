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

/** ISO date (YYYY-MM-DD) -> short label like "Apr 7". */
export function formatWeekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
