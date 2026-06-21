import { getActivities, getWeeklyTrainingLoad, getSummary } from "@/lib/activities";
import { connectToDatabase } from "@/lib/db";
import { StravaAccount } from "@/lib/models/StravaAccount";

export const resolvers = {
  Query: {
    activities: (_parent: unknown, args: { limit?: number }) => getActivities(args.limit),
    weeklyTrainingLoad: (_parent: unknown, args: { weeks?: number }) =>
      getWeeklyTrainingLoad(args.weeks ?? 12),
    summary: () => getSummary(),
    stravaConnected: async () => {
      const conn = await connectToDatabase();
      if (!conn) return false;
      const exists = await StravaAccount.exists({});
      return exists !== null;
    },
  },
};
