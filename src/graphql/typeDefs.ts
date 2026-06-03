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

  type Query {
    activities(limit: Int): [Activity!]!
    weeklyTrainingLoad(weeks: Int): [WeeklyLoad!]!
    summary: DashboardSummary!
  }
`;
