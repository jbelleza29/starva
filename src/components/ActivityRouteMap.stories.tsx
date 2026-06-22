import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActivityRouteMap } from "./ActivityRouteMap";

// Minimal Google-encoded polyline encoder for deterministic story data.
function encode(coords: [number, number][]): string {
  let pLat = 0, pLng = 0;
  const chars: number[] = [];
  for (const [lat, lng] of coords) {
    for (const [v, p] of [[lat, pLat], [lng, pLng]] as [number, number][]) {
      let n = Math.round((v - p) * 1e5);
      n = n < 0 ? ~(n << 1) : n << 1;
      while (n >= 0x20) { chars.push((0x20 | (n & 0x1f)) + 63); n >>= 5; }
      chars.push(n + 63);
    }
    pLat = lat; pLng = lng;
  }
  return String.fromCharCode(...chars);
}

// ~5 km loop around Pickering, ON
const RUN: [number, number][] = [
  [43.8337, -79.0868], [43.8352, -79.0851], [43.8370, -79.0830],
  [43.8385, -79.0808], [43.8395, -79.0780], [43.8382, -79.0755],
  [43.8363, -79.0742], [43.8345, -79.0758], [43.8337, -79.0790],
  [43.8337, -79.0868],
];

// ~2 km out-and-back
const SHORT: [number, number][] = [
  [43.8337, -79.0868], [43.8348, -79.0845], [43.8360, -79.0822],
  [43.8348, -79.0845], [43.8337, -79.0868],
];

const meta = {
  title: "Components/ActivityRouteMap",
  component: ActivityRouteMap,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { polyline: encode(RUN) },
} satisfies Meta<typeof ActivityRouteMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Typical ~5 km loop — the standard use case. */
export const Default: Story = {};

/** Short out-and-back — fewer points, verifies the path still renders cleanly. */
export const ShortRoute: Story = {
  args: { polyline: encode(SHORT) },
};

/** Empty polyline — component should render nothing gracefully. */
export const Empty: Story = {
  args: { polyline: "" },
};
