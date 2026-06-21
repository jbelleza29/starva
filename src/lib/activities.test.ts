import { describe, expect, it } from "vitest";
import { getWeeklyTrainingLoad } from "./activities";

// No MONGODB_URI in the test environment — getActivities() falls back to
// the deterministic sample dataset, so these tests run without a real DB.

describe("getWeeklyTrainingLoad", () => {
  it("returns at most the requested number of weeks", async () => {
    const result = await getWeeklyTrainingLoad(4);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("weeks are sorted oldest to newest", async () => {
    const result = await getWeeklyTrainingLoad(12);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].weekStart >= result[i - 1].weekStart).toBe(true);
    }
  });

  it("each week start falls on a Monday", async () => {
    const result = await getWeeklyTrainingLoad(12);
    for (const week of result) {
      const day = new Date(`${week.weekStart}T00:00:00Z`).getUTCDay();
      expect(day).toBe(1); // 1 = Monday
    }
  });

  it("filtering by type returns a subset of activity count", async () => {
    const all = await getWeeklyTrainingLoad(12);
    const runs = await getWeeklyTrainingLoad(12, "Run");
    const allCount = all.reduce((s, w) => s + w.activityCount, 0);
    const runCount = runs.reduce((s, w) => s + w.activityCount, 0);
    expect(runCount).toBeLessThanOrEqual(allCount);
  });
});
