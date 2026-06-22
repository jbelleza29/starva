import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ActivityLeafletMap from "./ActivityLeafletMap";

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

// ~30 km ride along the waterfront
const RIDE: [number, number][] = [
  [43.8337, -79.0868], [43.8290, -79.0712], [43.8245, -79.0556],
  [43.8198, -79.0400], [43.8150, -79.0244], [43.8102, -79.0088],
  [43.8055, -78.9932], [43.8008, -78.9776],
];

const meta = {
  title: "Components/ActivityLeafletMap",
  component: ActivityLeafletMap,
  parameters: {
    layout: "padded",
    // Give extra time for OpenStreetMap tiles to load before Chromatic snapshots.
    chromatic: { delay: 2000 },
  },
  tags: ["autodocs"],
  args: { polyline: encode(RUN) },
} satisfies Meta<typeof ActivityLeafletMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Running route — short loop, auto-fits to show the full route. */
export const Default: Story = {};

/** Cycling route — longer and more linear, tests a different map zoom level. */
export const Ride: Story = {
  args: { polyline: encode(RIDE) },
};
