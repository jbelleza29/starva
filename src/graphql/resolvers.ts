import {
  getActivities,
  getWeeklyTrainingLoad,
  getSummary,
  getActivityTypeBreakdown,
  getActivityTypes,
  getDailyHeatmap,
  getHighlights,
  getLongestPerType,
} from "@/lib/activities";
import { getGoals, createGoal, deleteGoal } from "@/lib/goals";
import { connectToDatabase } from "@/lib/db";
import { StravaAccount } from "@/lib/models/StravaAccount";

export const resolvers = {
  Query: {
    activities: (_parent: unknown, args: { limit?: number }) =>
      getActivities({ limit: args.limit }),
    weeklyTrainingLoad: (_parent: unknown, args: { weeks?: number; type?: string }) =>
      getWeeklyTrainingLoad(args.weeks ?? 12, args.type),
    summary: () => getSummary(),
    stravaConnected: async () => {
      const conn = await connectToDatabase();
      if (!conn) return false;
      const exists = await StravaAccount.exists({});
      return exists !== null;
    },
    activityTypes: () => getActivityTypes(),
    activityTypeBreakdown: () => getActivityTypeBreakdown(),
    dailyHeatmap: (_parent: unknown, args: { days?: number }) =>
      getDailyHeatmap(args.days ?? 365),
    highlights: () => getHighlights(),
    longestPerType: () => getLongestPerType(),
    goals: () => getGoals(),
  },
  Mutation: {
    createGoal: (
      _parent: unknown,
      args: { activityType: string; metric: string; target: number; month: string },
    ) => createGoal(args.activityType, args.metric, args.target, args.month),
    deleteGoal: (_parent: unknown, args: { id: string }) => deleteGoal(args.id),
  },
};
