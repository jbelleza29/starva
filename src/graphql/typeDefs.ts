export const typeDefs = `#graphql
  type Activity {
    id: ID!
    stravaId: Int!
    name: String!
    type: String!
    startDate: String!
    distance: Float!
    movingTime: Int!
    elapsedTime: Int!
    totalElevationGain: Float!
    averageSpeed: Float!
    averageHeartrate: Float
  }

  type WeeklyLoad {
    weekStart: String!
    distance: Float!
    movingTime: Int!
    activityCount: Int!
  }

  type DashboardSummary {
    totalDistance: Float!
    totalMovingTime: Int!
    activityCount: Int!
    totalElevationGain: Float!
  }

  type ActivityTypeBreakdown {
    type: String!
    count: Int!
    distance: Float!
    movingTime: Int!
  }

  type DailyActivity {
    date: String!
    movingTime: Int!
  }

  type DashboardHighlights {
    bestWeekDistance: Float!
    bestWeekStart: String!
    longestActivityDistance: Float!
    longestActivityName: String!
    longestActivityType: String!
    currentWeekDistance: Float!
    avgWeekDistance: Float!
  }

  type Query {
    activities(limit: Int): [Activity!]!
    weeklyTrainingLoad(weeks: Int, type: String): [WeeklyLoad!]!
    summary: DashboardSummary!
    stravaConnected: Boolean!
    activityTypes: [String!]!
    activityTypeBreakdown: [ActivityTypeBreakdown!]!
    dailyHeatmap(days: Int): [DailyActivity!]!
    highlights: DashboardHighlights!
  }
`;
