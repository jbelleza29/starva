import { connectToDatabase } from "./db";
import { Goal, type GoalDoc } from "./models/Goal";
import { Activity } from "./models/Activity";
import type mongoose from "mongoose";

export interface GoalRecord {
  id: string;
  activityType: string;
  metric: string;
  target: number;
  month: string;
  progress: number; // current value: meters or seconds
  createdAt: string;
}

async function computeProgress(
  goal: GoalDoc & { _id: mongoose.Types.ObjectId },
): Promise<number> {
  const [year, month] = goal.month.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month,     1));

  const filter: Record<string, unknown> = { startDate: { $gte: start, $lt: end } };
  if (goal.activityType !== "All") filter.type = goal.activityType;

  const docs = await Activity.find(filter).select("distance movingTime").lean();
  return docs.reduce(
    (sum, d) => sum + (goal.metric === "distance" ? d.distance : d.movingTime),
    0,
  );
}

function toRecord(g: GoalDoc & { _id: mongoose.Types.ObjectId }, progress: number): GoalRecord {
  return {
    id: String(g._id),
    activityType: g.activityType,
    metric: g.metric,
    target: g.target,
    month: g.month,
    progress,
    createdAt: new Date(g.createdAt).toISOString(),
  };
}

export async function getGoals(): Promise<GoalRecord[]> {
  const conn = await connectToDatabase();
  if (!conn) return [];
  const goals = await Goal.find().sort({ month: -1, createdAt: -1 }).lean();
  return Promise.all(goals.map(async (g) => toRecord(g, await computeProgress(g))));
}

export async function createGoal(
  activityType: string,
  metric: string,
  target: number,
  month: string,
): Promise<GoalRecord> {
  await connectToDatabase();
  const g = await Goal.create({ activityType, metric: metric as "distance" | "time", target, month });
  const progress = await computeProgress(g);
  return toRecord(g, progress);
}

export async function deleteGoal(id: string): Promise<boolean> {
  await connectToDatabase();
  const result = await Goal.deleteOne({ _id: id });
  return result.deletedCount > 0;
}
