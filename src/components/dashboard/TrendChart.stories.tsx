import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrendChart } from "./TrendChart";

// A realistic 12-week block: a build with a taper at the end.
const weeklyKm = [
  { label: "Mar 16", value: 28 },
  { label: "Mar 23", value: 34 },
  { label: "Mar 30", value: 31 },
  { label: "Apr 6", value: 42 },
  { label: "Apr 13", value: 38 },
  { label: "Apr 20", value: 45 },
  { label: "Apr 27", value: 40 },
  { label: "May 4", value: 52 },
  { label: "May 11", value: 48 },
  { label: "May 18", value: 55 },
  { label: "May 25", value: 21 },
  { label: "Jun 1", value: 15 },
];

const meta = {
  title: "Dashboard/TrendChart",
  component: TrendChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  // The chart is width-responsive, so give it a sized parent to render into.
  decorators: [
    (Story) => (
      <div style={{ width: 640 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    data: weeklyKm,
    unit: " km",
    // Disable animation so Chromatic captures a deterministic frame.
    animate: false,
  },
} satisfies Meta<typeof TrendChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortRange: Story = {
  args: { data: weeklyKm.slice(-4) },
};

export const Steady: Story = {
  args: { data: weeklyKm.map((week) => ({ ...week, value: 30 })) },
};

export const CustomColor: Story = {
  args: { color: "#3b82f6" },
};
