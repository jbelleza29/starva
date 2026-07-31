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
  since?: Date;
}

/** Returns activities from MongoDB if configured, else the sample dataset. */
export async function getActivities(query?: ActivityQuery): Promise<ActivityRecord[]> {
  const { limit, type, since } = query ?? {};
  const conn = await connectToDatabase();

  if (conn) {
    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (since) filter.startDate = { $gte: since };
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
  if (since) sample = sample.filter((a) => new Date(a.startDate) >= since);
  return limit ? sample.slice(0, limit) : sample;
}

/** ISO date of the most recent activity, or null when there are none. */
export async function getLastActivityDate(): Promise<string | null> {
  const [latest] = await getActivities({ limit: 1 });
  return latest?.startDate ?? null;
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

/** Monday starting the N-week dashboard window that ends with the current week. */
export function dashboardWindowStart(weeks = 12): Date {
  const start = startOfWeek(new Date());
  start.setUTCDate(start.getUTCDate() - (weeks - 1) * 7);
  return start;
}

/** Monday keys (YYYY-MM-DD) for each week of the window, oldest first. */
function windowWeekKeys(weeks: number): string[] {
  const cursor = dashboardWindowStart(weeks);
  const keys: string[] = [];
  for (let i = 0; i < weeks; i += 1) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return keys;
}

const EMPTY_WEEK = (weekStart: string): WeeklyLoad => ({
  weekStart,
  distance: 0,
  movingTime: 0,
  activityCount: 0,
});

/**
 * Aggregates activities into weekly training load, optionally filtered by type.
 * Clamped to the last N calendar weeks and zero-filled, so sparse types don't
 * stretch years of data onto a "recent weeks" axis.
 */
export async function getWeeklyTrainingLoad(weeks = 12, type?: string): Promise<WeeklyLoad[]> {
  const activities = await getActivities({ type, since: dashboardWindowStart(weeks) });
  const byWeek = new Map<string, WeeklyLoad>();

  for (const a of activities) {
    const key = startOfWeek(new Date(a.startDate)).toISOString().slice(0, 10);
    const entry = byWeek.get(key) ?? EMPTY_WEEK(key);
    entry.distance += a.distance;
    entry.movingTime += a.movingTime;
    entry.activityCount += 1;
    byWeek.set(key, entry);
  }

  return windowWeekKeys(weeks).map((key) => byWeek.get(key) ?? EMPTY_WEEK(key));
}

export interface TypeWeeklyLoad {
  type: string;
  series: WeeklyLoad[];
}

/**
 * Weekly training load split per activity type, zero-filled over the last N
 * calendar weeks so every type's series aligns on the same x-axis.
 */
export async function getWeeklyTrainingLoadByType(weeks = 12): Promise<TypeWeeklyLoad[]> {
  const activities = await getActivities({ since: dashboardWindowStart(weeks) });
  const byType = new Map<string, Map<string, WeeklyLoad>>();

  for (const a of activities) {
    const key = startOfWeek(new Date(a.startDate)).toISOString().slice(0, 10);
    const typeMap = byType.get(a.type) ?? new Map<string, WeeklyLoad>();
    const entry = typeMap.get(key) ?? EMPTY_WEEK(key);
    entry.distance += a.distance;
    entry.movingTime += a.movingTime;
    entry.activityCount += 1;
    typeMap.set(key, entry);
    byType.set(a.type, typeMap);
  }

  const window = windowWeekKeys(weeks);

  return Array.from(byType.entries())
    .map(([type, typeMap]) => ({
      type,
      series: window.map((weekStart) => typeMap.get(weekStart) ?? EMPTY_WEEK(weekStart)),
    }))
    .sort(
      (a, b) =>
        b.series.reduce((sum, w) => sum + w.movingTime, 0) -
        a.series.reduce((sum, w) => sum + w.movingTime, 0),
    );
}

export interface DashboardSummary {
  totalDistance: number;
  totalMovingTime: number;
  activityCount: number;
  totalElevationGain: number;
}

export async function getSummary(since?: Date): Promise<DashboardSummary> {
  const activities = await getActivities({ since });
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

/**
 * Computes highlight stats over the last N calendar weeks: best week, longest
 * activity, and this week vs the window average (zero weeks included, so a
 * quiet stretch lowers the average instead of being ignored).
 */
export async function getHighlights(weeks = 12): Promise<DashboardHighlights> {
  const activities = await getActivities({ since: dashboardWindowStart(weeks) });

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

  // Average over every completed calendar week in the window, not just weeks
  // with activity — otherwise skipped weeks inflate the baseline.
  const completedWeeks = weeks - 1;
  const completedTotal = Array.from(byWeek.entries())
    .filter(([key]) => key !== currentWeekKey)
    .reduce((sum, [, dist]) => sum + dist, 0);
  const avgWeekDist = completedWeeks > 0 ? completedTotal / completedWeeks : 0;

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
export async function getActivityTypeBreakdown(since?: Date): Promise<ActivityTypeBreakdown[]> {
  const activities = await getActivities({ since });
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
export async function getActivityTypes(since?: Date): Promise<string[]> {
  const breakdown = await getActivityTypeBreakdown(since);
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
export async function getLongestPerType(since?: Date): Promise<ActivityPeak[]> {
  const activities = await getActivities({ since });
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
