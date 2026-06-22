"use client";

/** Decodes a Google-encoded polyline string into [lat, lng] pairs. */
function decode(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = result = 0;
    do { b = encoded.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

/** Converts lat/lng coords to a centered, aspect-ratio-preserved SVG path string. */
function toPath(coords: [number, number][], W = 800, H = 360, pad = 28): string {
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const latMin = Math.min(...lats), latMax = Math.max(...lats);
  const lngMin = Math.min(...lngs), lngMax = Math.max(...lngs);
  const latRange = latMax - latMin || 1e-6;
  const lngRange = lngMax - lngMin || 1e-6;
  const scale = Math.min((W - pad * 2) / lngRange, (H - pad * 2) / latRange);
  const ox = pad + ((W - pad * 2) - scale * lngRange) / 2;
  const oy = pad + ((H - pad * 2) - scale * latRange) / 2;
  return coords
    .map(([la, ln], idx) => {
      const x = (ox + (ln - lngMin) * scale).toFixed(1);
      const y = (oy + (latMax - la) * scale).toFixed(1);
      return `${idx === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

export interface ActivityRouteMapProps {
  polyline: string;
}

/**
 * Renders a GPS route as an SVG path decoded from a Strava summary_polyline.
 * No external mapping library — pure SVG. Part of the dashboard component kit.
 */
export function ActivityRouteMap({ polyline }: ActivityRouteMapProps) {
  const coords = decode(polyline);
  if (coords.length < 2) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-neutral-900">
      <svg
        viewBox="0 0 800 360"
        className="w-full"
        aria-label="Activity route map"
      >
        <path
          d={toPath(coords)}
          fill="none"
          stroke="#f97316"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}
