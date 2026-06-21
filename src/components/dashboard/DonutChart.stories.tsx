import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DonutChart } from "./DonutChart";

const meta = {
  title: "Dashboard/DonutChart",
  component: DonutChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  // Sized parent — ResponsiveContainer measures its parent to determine width.
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    animate: false, // disable Recharts mount animation for deterministic Chromatic snapshots
    data: [
      { type: "Run",  count: 120, distance: 850_000,  movingTime: 432_000 },
      { type: "Ride", count: 45,  distance: 1_200_000, movingTime: 180_000 },
      { type: "Walk", count: 20,  distance: 80_000,   movingTime: 72_000  },
      { type: "Swim", count: 15,  distance: 22_000,   movingTime: 54_000  },
    ],
  },
} satisfies Meta<typeof DonutChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Balanced multi-type breakdown — typical active athlete. */
export const Default: Story = {};

/** Single activity type — the whole donut is one slice. */
export const SingleType: Story = {
  args: {
    data: [{ type: "Run", count: 180, distance: 1_200_000, movingTime: 648_000 }],
  },
};

/** One dominant type with several thin slices — tests label legibility. */
export const DominantType: Story = {
  args: {
    data: [
      { type: "Run",           count: 200, distance: 1_500_000, movingTime: 720_000 },
      { type: "Ride",          count: 8,   distance: 200_000,   movingTime: 28_800  },
      { type: "Walk",          count: 5,   distance: 15_000,    movingTime: 10_800  },
      { type: "WeightTraining",count: 4,   distance: 0,         movingTime: 7_200   },
    ],
  },
};

/** Five types — verifies legend layout with more entries. */
export const ManyTypes: Story = {
  args: {
    data: [
      { type: "Run",           count: 80,  distance: 600_000, movingTime: 288_000 },
      { type: "Ride",          count: 40,  distance: 900_000, movingTime: 144_000 },
      { type: "Swim",          count: 20,  distance: 30_000,  movingTime: 72_000  },
      { type: "Hike",          count: 15,  distance: 120_000, movingTime: 54_000  },
      { type: "WeightTraining",count: 30,  distance: 0,       movingTime: 54_000  },
      { type: "Yoga",          count: 12,  distance: 0,       movingTime: 21_600  },
    ],
  },
};
