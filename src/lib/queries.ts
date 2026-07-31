import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { gqlFetch } from "./gql";
import type { DonutChartDataItem } from "@/components/dashboard/DonutChart";
import type { HeatmapDay } from "@/components/dashboard/HeatmapChart";

// ── Types ──────────────────────────────────────────────────────────────────

export interface DashboardData {
  stravaConnected: boolean;
  lastActivityAt: string | null;
  activityTypes: string[];
  activityTypeBreakdown: DonutChartDataItem[];
  summary: {
    totalDistance: number;
    totalMovingTime: number;
    activityCount: number;
    totalElevationGain: number;
  };
  dailyHeatmap: HeatmapDay[];
  longestPerType: {
    id: string;
    type: string;
    name: string;
    distance: number;
    movingTime: number;
  }[];
  goals: {
    id: string;
    activityType: string;
    metric: string;
    target: number;
    month: string;
    progress: number;
  }[];
  highlights: {
    bestWeekDistance: number;
    bestWeekStart: string;
    longestActivityDistance: number;
    longestActivityName: string;
    longestActivityType: string;
    currentWeekDistance: number;
    avgWeekDistance: number;
  };
}

export interface ActivityRecord {
  id: string;
  name: string;
  type: string;
  startDate: string;
  distance: number;
  movingTime: number;
  totalElevationGain: number;
  averageSpeed: number;
  averageHeartrate: number | null;
}

export interface GoalRecord {
  id: string;
  activityType: string;
  metric: string;
  target: number;
  month: string;
  progress: number;
  createdAt: string;
}

// ── GQL strings ────────────────────────────────────────────────────────────

const DASHBOARD_QUERY = `
  query Dashboard {
    stravaConnected
    lastActivityAt
    activityTypes
    activityTypeBreakdown { type count distance movingTime }
    summary { totalDistance totalMovingTime activityCount totalElevationGain }
    dailyHeatmap(days: 365) { date movingTime }
    longestPerType { id type name distance movingTime }
    highlights {
      bestWeekDistance bestWeekStart
      longestActivityDistance longestActivityName longestActivityType
      currentWeekDistance avgWeekDistance
    }
    goals { id activityType metric target month progress }
  }
`;

const TREND_QUERY = `
  query TrendLoad($type: String) {
    weeklyTrainingLoad(weeks: 12, type: $type) { weekStart movingTime }
  }
`;

const TREND_BY_TYPE_QUERY = `
  query TrendLoadByType {
    weeklyTrainingLoadByType(weeks: 12) {
      type
      series { weekStart movingTime }
    }
  }
`;

const ACTIVITIES_QUERY = `
  query Activities($limit: Int) {
    activities(limit: $limit) {
      id name type startDate distance movingTime
      totalElevationGain averageSpeed averageHeartrate
    }
  }
`;

const GOALS_QUERY = `
  query Goals {
    goals { id activityType metric target month progress createdAt }
    activityTypes
  }
`;

const CREATE_GOAL_MUTATION = `
  mutation CreateGoal($activityType: String!, $metric: String!, $target: Float!, $month: String!) {
    createGoal(activityType: $activityType, metric: $metric, target: $target, month: $month) {
      id activityType metric target month progress createdAt
    }
  }
`;

const DELETE_GOAL_MUTATION = `
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id)
  }
`;

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useDashboardQuery() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => gqlFetch<DashboardData>(DASHBOARD_QUERY),
  });
}

export function useTrendQuery(type: string | null, enabled = true) {
  return useQuery({
    queryKey: ["trend", type],
    queryFn: () =>
      gqlFetch<{ weeklyTrainingLoad: { weekStart: string; movingTime: number }[] }>(
        TREND_QUERY,
        type ? { type } : undefined,
      ),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTrendByTypeQuery(enabled = true) {
  return useQuery({
    queryKey: ["trendByType"],
    queryFn: () =>
      gqlFetch<{
        weeklyTrainingLoadByType: {
          type: string;
          series: { weekStart: string; movingTime: number }[];
        }[];
      }>(TREND_BY_TYPE_QUERY),
    enabled,
  });
}

export function useActivitiesQuery(limit?: number) {
  return useQuery({
    queryKey: ["activities", limit ?? null],
    queryFn: () =>
      gqlFetch<{ activities: ActivityRecord[] }>(
        ACTIVITIES_QUERY,
        limit ? { limit } : undefined,
      ),
  });
}

export function useGoalsQuery() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => gqlFetch<{ goals: GoalRecord[]; activityTypes: string[] }>(GOALS_QUERY),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { activityType: string; metric: string; target: number; month: string }) =>
      gqlFetch(CREATE_GOAL_MUTATION, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlFetch(DELETE_GOAL_MUTATION, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
