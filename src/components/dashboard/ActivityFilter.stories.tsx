import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActivityFilter } from "./ActivityFilter";

const ALL_TYPES = ["Run", "Ride", "Swim", "Walk", "Hike", "WeightTraining", "Yoga"];

const meta = {
  title: "Dashboard/ActivityFilter",
  component: ActivityFilter,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    types: ["Run", "Ride", "Walk"],
    value: null,
    onChange: () => {},
  },
} satisfies Meta<typeof ActivityFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Default closed state — "All activities" showing. */
export const Default: Story = {};

/** A specific type is selected — button shows its icon + name. */
export const WithSelection: Story = {
  args: { value: "Run" },
};

/** Only two types available — minimum realistic dataset. */
export const FewTypes: Story = {
  args: { types: ["Run", "Ride"] },
};

/** Full list of types — verifies dropdown height and scroll on many options. */
export const ManyTypes: Story = {
  args: { types: ALL_TYPES, value: "WeightTraining" },
};
