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
  summaryPolyline?: string;
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
      summaryPolyline: d.summaryPolyline,
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

export interface DashboardHighlights {
  bestWeekDistance: number;
  bestWeekStart: string;
  longestActivityDistance: number;
  longestActivityName: string;
  longestActivityType: string;
  currentWeekDistance: number;
  avgWeekDistance: number;
}

/** Computes highlight stats: best week, longest activity, and this week vs average. */
export async function getHighlights(): Promise<DashboardHighlights> {
  const activities = await getActivities();

  if (activities.length === 0) {
    return {
      bestWeekDistance: 0, bestWeekStart: "",
      longestActivityDistance: 0, longestActivityName: "—", longestActivityType: "",
      currentWeekDistance: 0, avgWeekDistance: 0,
    };
  }

  const longest = activities.reduce((max, a) => a.distance > max.distance ? a : max, activities[0]);

  const byWeek = new Map<string, number>();
  for (const a of activities) {
    const key = startOfWeek(new Date(a.startDate)).toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) ?? 0) + a.distance);
  }

  let bestWeekKey = "";
  let bestWeekDist = 0;
  for (const [key, dist] of byWeek.entries()) {
    if (dist > bestWeekDist) { bestWeekDist = dist; bestWeekKey = key; }
  }

  const currentWeekKey = startOfWeek(new Date()).toISOString().slice(0, 10);
  const currentWeekDist = byWeek.get(currentWeekKey) ?? 0;

  const completedWeekDistances = Array.from(byWeek.entries())
    .filter(([key]) => key !== currentWeekKey)
    .map(([, dist]) => dist);
  const avgWeekDist = completedWeekDistances.length > 0
    ? completedWeekDistances.reduce((s, d) => s + d, 0) / completedWeekDistances.length
    : 0;

  return {
    bestWeekDistance: bestWeekDist,
    bestWeekStart: bestWeekKey,
    longestActivityDistance: longest.distance,
    longestActivityName: longest.name,
    longestActivityType: longest.type,
    currentWeekDistance: currentWeekDist,
    avgWeekDistance: avgWeekDist,
  };
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

export interface ActivityPeak {
  id: string;
  type: string;
  name: string;
  distance: number;
  movingTime: number;
}

/** Returns the longest activity (by distance, falling back to time) for each type. */
export async function getLongestPerType(): Promise<ActivityPeak[]> {
  const activities = await getActivities();
  const byType = new Map<string, ActivityRecord>();

  for (const a of activities) {
    const current = byType.get(a.type);
    if (
      !current ||
      a.distance > current.distance ||
      (a.distance === current.distance && a.movingTime > current.movingTime)
    ) {
      byType.set(a.type, a);
    }
  }

  return Array.from(byType.values()).map((a) => ({
    id: a.id,
    type: a.type,
    name: a.name,
    distance: a.distance,
    movingTime: a.movingTime,
  }));
}

/** Fetch a single activity by its id (MongoDB _id or sample data id). */
export async function getActivityById(id: string): Promise<ActivityRecord | null> {
  const conn = await connectToDatabase();

  if (conn) {
    try {
      const doc = await Activity.findById(id).lean();
      if (!doc) return null;
      return {
        id: String(doc._id),
        stravaId: doc.stravaId,
        name: doc.name,
        type: doc.type,
        startDate: new Date(doc.startDate).toISOString(),
        distance: doc.distance,
        movingTime: doc.movingTime,
        elapsedTime: doc.elapsedTime,
        totalElevationGain: doc.totalElevationGain ?? 0,
        averageSpeed: doc.averageSpeed ?? 0,
        averageHeartrate: doc.averageHeartrate,
        summaryPolyline: doc.summaryPolyline,
      };
    } catch {
      return null;
    }
  }

  return getSampleActivities().find((a) => a.id === id) ?? null;
}

export interface DailyActivity {
  date: string;    // YYYY-MM-DD
  movingTime: number; // seconds
}

/**
 * Returns total moving time per day for the last N days.
 * Queries MongoDB directly with a date filter — does not load all activities.
 */
export async function getDailyHeatmap(days = 365): Promise<DailyActivity[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const conn = await connectToDatabase();

  if (conn) {
    const docs = await Activity.find({ startDate: { $gte: since } })
      .select("startDate movingTime")
      .lean();

    const byDay = new Map<string, number>();
    for (const d of docs) {
      const key = new Date(d.startDate).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + d.movingTime);
    }
    return Array.from(byDay.entries())
      .map(([date, movingTime]) => ({ date, movingTime }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Sample data fallback
  const cutoffMs = since.getTime();
  const byDay = new Map<string, number>();
  for (const a of getSampleActivities()) {
    if (new Date(a.startDate).getTime() < cutoffMs) continue;
    const key = a.startDate.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + a.movingTime);
  }
  return Array.from(byDay.entries())
    .map(([date, movingTime]) => ({ date, movingTime }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
