import {
  getActivities,
  getWeeklyTrainingLoad,
  getWeeklyTrainingLoadByType,
  getSummary,
  getActivityTypeBreakdown,
  getActivityTypes,
  getDailyHeatmap,
  getHighlights,
  getLongestPerType,
  getActivityById,
  getLastActivityDate,
  dashboardWindowStart,
} from "@/lib/activities";
import { getGoals, createGoal, deleteGoal } from "@/lib/goals";
import { connectToDatabase } from "@/lib/db";
import { StravaAccount } from "@/lib/models/StravaAccount";

export const resolvers = {
  Query: {
    activity: (_parent: unknown, args: { id: string }) => getActivityById(args.id),
    activities: (_parent: unknown, args: { limit?: number }) =>
      getActivities({ limit: args.limit }),
    weeklyTrainingLoad: (_parent: unknown, args: { weeks?: number; type?: string }) =>
      getWeeklyTrainingLoad(args.weeks ?? 12, args.type),
    weeklyTrainingLoadByType: (_parent: unknown, args: { weeks?: number }) =>
      getWeeklyTrainingLoadByType(args.weeks ?? 12),
    // Dashboard aggregates share one 12-week window so the page's "last 12
    // weeks" claim holds for every number on it.
    summary: () => getSummary(dashboardWindowStart()),
    lastActivityAt: () => getLastActivityDate(),
    stravaConnected: async () => {
      const conn = await connectToDatabase();
      if (!conn) return false;
      const exists = await StravaAccount.exists({});
      return exists !== null;
    },
    activityTypes: () => getActivityTypes(dashboardWindowStart()),
    activityTypeBreakdown: () => getActivityTypeBreakdown(dashboardWindowStart()),
    dailyHeatmap: (_parent: unknown, args: { days?: number }) =>
      getDailyHeatmap(args.days ?? 365),
    highlights: () => getHighlights(),
    longestPerType: () => getLongestPerType(dashboardWindowStart()),
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
