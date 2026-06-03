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

/** Returns activities from MongoDB if configured, else the sample dataset. */
export async function getActivities(limit?: number): Promise<ActivityRecord[]> {
  const conn = await connectToDatabase();

  if (conn) {
    const docs = await Activity.find()
      .sort({ startDate: -1 })
      .limit(limit ?? 200)
      .lean();

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

  const sample = getSampleActivities();
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

/** Aggregates activities into weekly training load (the non-trivial aggregation). */
export async function getWeeklyTrainingLoad(weeks = 12): Promise<WeeklyLoad[]> {
  const activities = await getActivities();
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
