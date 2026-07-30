import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrendChart } from "./TrendChart";
import { typeColor } from "@/lib/activityColors";

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

const scale = (factor: number) =>
  weeklyKm.map((week) => ({ ...week, value: Math.round(week.value * factor) }));

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
    series: [{ name: "Distance", data: weeklyKm }],
    unit: " km",
    // Disable animation so Chromatic captures a deterministic frame.
    animate: false,
  },
} satisfies Meta<typeof TrendChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortRange: Story = {
  args: { series: [{ name: "Distance", data: weeklyKm.slice(-4) }] },
};

export const Steady: Story = {
  args: { series: [{ name: "Distance", data: weeklyKm.map((week) => ({ ...week, value: 30 })) }] },
};

export const CustomColor: Story = {
  args: { series: [{ name: "Distance", color: "#3b82f6", data: weeklyKm }] },
};

// One line per activity type, as rendered when "All activities" is selected.
export const MultiSeries: Story = {
  args: {
    series: [
      { name: "Run", color: typeColor("Run", 0), data: weeklyKm },
      { name: "Ride", color: typeColor("Ride", 1), data: scale(0.6) },
      { name: "Walk", color: typeColor("Walk", 2), data: scale(0.25) },
    ],
  },
};
