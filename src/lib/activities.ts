import { connectToDatabase } from "./db";
import { Activity } from "./models/Activity";
import { getSampleActivities } from "./sampleData";

export interface ActivityRecord {
  id: string;
  stravaId: number;
  name: string;
  type: string;
  startDate: string; // ISO string
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  averageSpeed: number;
  averageHeartrate?: number;
}

interface ActivityQuery {
  limit?: number;
  type?: string;
}

/** Returns activities from MongoDB if configured, else the sample dataset. */
export async function getActivities(query?: ActivityQuery): Promise<ActivityRecord[]> {
  const { limit, type } = query ?? {};
  const conn = await connectToDatabase();

  if (conn) {
    const filter = type ? { type } : {};
    const q = Activity.find(filter).sort({ startDate: -1 });
    if (limit) q.limit(limit);
    const docs = await q.lean();

    return docs.map((d) => ({
      id: String(d._id),
      stravaId: d.stravaId,
      name: d.name,
      type: d.type,
      startDate: new Date(d.startDate).toISOString(),
      distance: d.distance,
      movingTime: d.movingTime,
      elapsedTime: d.elapsedTime,
      totalElevationGain: d.totalElevationGain ?? 0,
      averageSpeed: d.averageSpeed ?? 0,
      averageHeartrate: d.averageHeartrate,
    }));
  }

  let sample = getSampleActivities();
  if (type) sample = sample.filter((a) => a.type === type);
  return limit ? sample.slice(0, limit) : sample;
}

export interface WeeklyLoad {
  weekStart: string; // YYYY-MM-DD (Monday)
  distance: number;
  movingTime: number;
  activityCount: number;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Aggregates activities into weekly training load, optionally filtered by type. */
export async function getWeeklyTrainingLoad(weeks = 12, type?: string): Promise<WeeklyLoad[]> {
  const activities = await getActivities({ type });
  const byWeek = new Map<string, WeeklyLoad>();

  for (const a of activities) {
    const key = startOfWeek(new Date(a.startDate)).toISOString().slice(0, 10);
    const entry =
      byWeek.get(key) ?? { weekStart: key, distance: 0, movingTime: 0, activityCount: 0 };
    entry.distance += a.distance;
    entry.movingTime += a.movingTime;
    entry.activityCount += 1;
    byWeek.set(key, entry);
  }

  return Array.from(byWeek.values())
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-weeks);
}

export interface DashboardSummary {
  totalDistance: number;
  totalMovingTime: number;
  activityCount: number;
  totalElevationGain: number;
}

export async function getSummary(): Promise<DashboardSummary> {
  const activities = await getActivities();
  return activities.reduce<DashboardSummary>(
    (acc, a) => ({
      totalDistance: acc.totalDistance + a.distance,
      totalMovingTime: acc.totalMovingTime + a.movingTime,
      activityCount: acc.activityCount + 1,
      totalElevationGain: acc.totalElevationGain + a.totalElevationGain,
    }),
    { totalDistance: 0, totalMovingTime: 0, activityCount: 0, totalElevationGain: 0 },
  );
}

export interface ActivityTypeBreakdown {
  type: string;
  count: number;
  distance: number;
  movingTime: number;
}

/** Returns distance, moving time, and count per activity type, sorted by moving time descending. */
export async function getActivityTypeBreakdown(): Promise<ActivityTypeBreakdown[]> {
  const activities = await getActivities();
  const byType = new Map<string, ActivityTypeBreakdown>();

  for (const a of activities) {
    const entry = byType.get(a.type) ?? { type: a.type, count: 0, distance: 0, movingTime: 0 };
    entry.count += 1;
    entry.distance += a.distance;
    entry.movingTime += a.movingTime;
    byType.set(a.type, entry);
  }

  return Array.from(byType.values()).sort((a, b) => b.movingTime - a.movingTime);
}

/** Returns the distinct activity types present in the dataset. */
export async function getActivityTypes(): Promise<string[]> {
  const breakdown = await getActivityTypeBreakdown();
  return breakdown.map((b) => b.type);
}
