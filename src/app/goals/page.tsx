"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { getActivityIcon } from "@/lib/activityIcons";
import { formatDistance, formatDuration } from "@/lib/format";

const GOALS_QUERY = gql`
  query Goals {
    goals {
      id
      activityType
      metric
      target
      month
      progress
      createdAt
    }
    activityTypes
  }
`;

const CREATE_GOAL = gql`
  mutation CreateGoal(
    $activityType: String!
    $metric: String!
    $target: Float!
    $month: String!
  ) {
    createGoal(
      activityType: $activityType
      metric: $metric
      target: $target
      month: $month
    ) {
      id activityType metric target month progress createdAt
    }
  }
`;

const DELETE_GOAL = gql`
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id)
  }
`;

interface GoalRecord {
  id: string;
  activityType: string;
  metric: string;
  target: number;
  month: string;
  progress: number;
  createdAt: string;
}

const METRICS = [
  { key: "distance", label: "Distance", unit: "km"  },
  { key: "time",     label: "Time",     unit: "hrs" },
] as const;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-US", {
    month: "long", year: "numeric",
  });
}

function formatValue(value: number, metric: string): string {
  return metric === "distance" ? formatDistance(value) : formatDuration(value);
}

export default function GoalsPage() {
  const { data, loading } = useQuery<{ goals: GoalRecord[]; activityTypes: string[] }>(
    GOALS_QUERY,
  );

  const [createGoal, { loading: creating }] = useMutation(CREATE_GOAL, {
    refetchQueries: [{ query: GOALS_QUERY }],
  });

  const [deleteGoal] = useMutation(DELETE_GOAL, {
    refetchQueries: [{ query: GOALS_QUERY }],
  });

  // Form state
  const [activityType, setActivityType] = useState("Run");
  const [metric, setMetric] = useState<"distance" | "time">("distance");
  const [targetInput, setTargetInput] = useState("");
  const [month, setMonth] = useState(currentMonth);

  const availableTypes = ["All", ...(data?.activityTypes ?? [])];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = parseFloat(targetInput);
    if (!raw || raw <= 0) return;
    const target = metric === "distance" ? raw * 1000 : raw * 3600;
    await createGoal({ variables: { activityType, metric, target, month } });
    setTargetInput("");
  }

  const goals = data?.goals ?? [];
  const thisMonth = currentMonth();
  const activeGoals  = goals.filter((g) => g.month === thisMonth);
  const pastGoals    = goals.filter((g) => g.month !== thisMonth);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Set monthly training goals and track progress against your Strava data.
      </p>

      {/* ── Create form ─────────────────────────────────────── */}
      <section className="mt-8 rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-semibold">New goal</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">

          {/* Activity type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Activity</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-800"
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "🏅 All activities" : `${getActivityIcon(t)} ${t}`}
                </option>
              ))}
            </select>
          </div>

          {/* Metric toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Metric</label>
            <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
              {METRICS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetric(key)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    metric === key
                      ? "bg-orange-500 text-white"
                      : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">
              Target ({metric === "distance" ? "km" : "hrs"})
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder={metric === "distance" ? "50" : "10"}
              required
              className="w-28 rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-800"
            />
          </div>

          {/* Month */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-800"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !targetInput}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {creating ? "Adding…" : "Add goal"}
          </button>
        </form>
      </section>

      {/* ── Goals list ──────────────────────────────────────── */}
      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900" />
      ) : goals.length === 0 ? (
        <p className="mt-8 text-center text-sm text-neutral-400">
          No goals yet — add one above to start tracking.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {activeGoals.length > 0 && (
            <GoalGroup title="This month" goals={activeGoals} onDelete={deleteGoal} />
          )}
          {pastGoals.length > 0 && (
            <GoalGroup title="Past goals" goals={pastGoals} onDelete={deleteGoal} />
          )}
        </div>
      )}
    </main>
  );
}

function GoalGroup({
  title,
  goals,
  onDelete,
}: {
  title: string;
  goals: GoalRecord[];
  onDelete: (opts: { variables: { id: string } }) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

function GoalCard({
  goal,
  onDelete,
}: {
  goal: GoalRecord;
  onDelete: (opts: { variables: { id: string } }) => void;
}) {
  const pct = Math.min(Math.round((goal.progress / goal.target) * 100), 100);
  const done = pct >= 100;

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {getActivityIcon(goal.activityType)}{" "}
            {goal.activityType === "All" ? "All activities" : goal.activityType}
            {" · "}
            {formatMonth(goal.month)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400 capitalize">
            {goal.metric === "distance" ? "Distance" : "Time"} goal:{" "}
            {formatValue(goal.target, goal.metric)}
          </p>
        </div>
        <button
          onClick={() => onDelete({ variables: { id: goal.id } })}
          className="shrink-0 rounded-full p-1 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
          aria-label="Delete goal"
        >
          ✕
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-neutral-500">{formatValue(goal.progress, goal.metric)}</span>
          <span className={done ? "font-semibold text-green-500" : "text-neutral-400"}>
            {done ? "✓ Complete" : `${pct}%`}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className={`h-full rounded-full transition-all ${done ? "bg-green-500" : "bg-orange-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-neutral-400">
          of {formatValue(goal.target, goal.metric)}
        </p>
      </div>
    </div>
  );
}
