"use client";

import dynamic from "next/dynamic";

// Leaflet is browser-only — dynamic import with ssr:false prevents it from
// running on the server. The loading skeleton matches the map height.
const LeafletMap = dynamic(() => import("./ActivityLeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[400px] w-full animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
    />
  ),
});

export function ActivityMap({ polyline }: { polyline: string }) {
  return <LeafletMap polyline={polyline} />;
}
