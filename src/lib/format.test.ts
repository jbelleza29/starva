import { describe, expect, it } from "vitest";
import { formatDuration, formatWeekLabel } from "./format";

describe("formatDuration", () => {
  it("shows only minutes when under an hour", () => {
    expect(formatDuration(1800)).toBe("30m");
  });

  it("switches to hours at exactly 60 minutes", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
  });

  it("rounds seconds to the nearest minute", () => {
    // 3661s = 61min 1sec → rounds to 61min → 1h 1m
    expect(formatDuration(3661)).toBe("1h 1m");
  });
});

describe("formatWeekLabel", () => {
  it("formats a Monday date as a short month + day", () => {
    // 2025-03-10 is a Monday
    expect(formatWeekLabel("2025-03-10")).toBe("Mar 10");
  });
});
