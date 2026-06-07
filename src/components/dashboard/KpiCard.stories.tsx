import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KpiCard } from "./KpiCard";

const meta = {
  title: "Dashboard/KpiCard",
  component: KpiCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Total distance",
    value: "412 km",
  },
} satisfies Meta<typeof KpiCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSublabel: Story = {
  args: {
    sublabel: "+12% vs last week",
  },
};

export const WithIcon: Story = {
  args: {
    icon: <span aria-hidden>🏃</span>,
  },
};

export const LongValue: Story = {
  args: {
    label: "Year to date",
    value: "1,284 km",
  },
};
