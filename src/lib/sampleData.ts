import type { ActivityRecord } from "./activities";

const TYPES = ["Run", "Ride", "Run", "Run", "Swim", "Ride"] as const;

/**
 * A deterministic sample dataset spanning the last ~12 weeks, used when no
 * MONGODB_URI is configured. Lets the dashboard run with zero setup while we
 * wire up real Strava OAuth + MongoDB Atlas.
 */
export function getSampleActivities(): ActivityRecord[] {
  const activities: ActivityRecord[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  let id = 1000;

  for (let i = 0; i < 84; i += 1) {
    if (i % 2 === 1) continue; // roughly every other day
    const type = TYPES[i % TYPES.length];
    const base = type === "Ride" ? 25000 : type === "Swim" ? 1800 : 8000;
    const jitter = ((i * 37) % 50) / 100;
    const distance = Math.round(base * (0.8 + jitter));
    const speed = type === "Ride" ? 7.5 : type === "Swim" ? 1.2 : 3.1;
    const movingTime = Math.round(distance / speed);

    activities.push({
      id: String(id),
      stravaId: id,
      name: `${type} session`,
      type,
      startDate: new Date(now - i * day).toISOString(),
      distance,
      movingTime,
      elapsedTime: movingTime + 120,
      totalElevationGain: type === "Ride" ? 200 + (i % 5) * 30 : (i % 5) * 15,
      averageSpeed: speed,
      averageHeartrate: 130 + (i % 25),
    });
    id += 1;
  }

  return activities;
}
