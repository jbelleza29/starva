"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

/** Decodes a Google-encoded polyline string into Leaflet LatLngTuple pairs. */
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

/** Auto-fits the map view to the route bounds with padding. */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [32, 32] });
    }
  }, [map, coords]);
  return null;
}

export default function ActivityLeafletMap({ polyline }: { polyline: string }) {
  const coords = decode(polyline);
  if (coords.length < 2) return null;

  return (
    <div className="overflow-hidden rounded-xl" style={{ height: 400 }}>
      <MapContainer
        center={coords[0]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Polyline positions={coords} color="#f97316" weight={4} opacity={0.85} />
        <FitBounds coords={coords} />
      </MapContainer>
    </div>
  );
}
