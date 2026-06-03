import { getActivities, getWeeklyTrainingLoad, getSummary } from "@/lib/activities";

export const resolvers = {
  Query: {
    activities: (_parent: unknown, args: { limit?: number }) => getActivities(args.limit),
    weeklyTrainingLoad: (_parent: unknown, args: { weeks?: number }) =>
      getWeeklyTrainingLoad(args.weeks ?? 12),
    summary: () => getSummary(),
  },
};
