import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HeatmapChart } from "./HeatmapChart";
import type { HeatmapDay } from "./HeatmapChart";

// Deterministic data generator — same (i * 37) % N jitter as sampleData.ts.
// Using Date.now() here is fine: the chart renders relative to "today" anyway,
// and Chromatic doesn't diff on date values, only on visual output.
function makeHeatmapData(everyN: number, baseSeconds: number): HeatmapDay[] {
  const data: HeatmapDay[] = [];
  const now = Date.now();
  const dayMs = 86_400_000;
  for (let i = 0; i < 365; i++) {
    if (i % everyN === 0) {
      const jitter = ((i * 37) % 50) / 100;
      data.push({
        date: new Date(now - i * dayMs).toISOString().slice(0, 10),
        movingTime: Math.round(baseSeconds * (0.7 + jitter)),
      });
    }
  }
  return data;
}

const meta = {
  title: "Dashboard/HeatmapChart",
  component: HeatmapChart,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    data: makeHeatmapData(2, 3_600), // every other day, ~1 hr
  },
} satisfies Meta<typeof HeatmapChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Realistic training year — activity every other day, mix of intensities. */
export const Default: Story = {};

/** Dense training — near-daily activity, heavy volume (marathon build). */
export const Dense: Story = {
  args: { data: makeHeatmapData(1, 5_400) }, // daily, ~1.5 hr
};

/** Sparse — roughly weekly activity only. */
export const Sparse: Story = {
  args: { data: makeHeatmapData(7, 2_400) }, // weekly, ~40 min
};

/** Empty — no activities at all; verifies empty-state rendering. */
export const Empty: Story = {
  args: { data: [] },
};
