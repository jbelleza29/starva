"use client";

import { useEffect, useRef, useState } from "react";

export const ACTIVITY_ICONS: Record<string, string> = {
  Run: "🏃",
  Ride: "🚴",
  Swim: "🏊",
  Walk: "🚶",
  Hike: "🥾",
  WeightTraining: "🏋️",
  Workout: "💪",
  Yoga: "🧘",
  EBikeRide: "⚡",
  VirtualRide: "💻",
  VirtualRun: "💻",
  AlpineSki: "⛷️",
  NordicSki: "🎿",
  Snowboard: "🏂",
  Kayaking: "🚣",
  Rowing: "🚣",
  RockClimbing: "🧗",
  IceSkate: "⛸️",
  Skateboard: "🛹",
};

export function getActivityIcon(type: string): string {
  return ACTIVITY_ICONS[type] ?? "🏅";
}

export interface ActivityFilterProps {
  /** Available activity types derived from the dataset. */
  types: string[];
  /** Currently selected type. `null` means "all". */
  value: string | null;
  onChange: (type: string | null) => void;
}

/**
 * Reusable activity-type filter dropdown. Shows an icon + name per option.
 * Accessible: keyboard-navigable, aria-expanded/aria-selected wired up.
 */
export function ActivityFilter({ types, value, onChange }: ActivityFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const selectedLabel = value ? `${getActivityIcon(value)} ${value}` : "🏅 All activities";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-neutral-800"
      >
        {selectedLabel}
        <svg
          className={`h-4 w-4 text-neutral-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Filter by activity type"
          className="absolute left-0 top-full z-10 mt-2 min-w-[190px] overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-neutral-900"
        >
          {[null, ...types].map((type) => {
            const label = type ? `${getActivityIcon(type)} ${type}` : "🏅 All activities";
            const selected = value === type;
            return (
              <li
                key={type ?? "__all__"}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(type);
                  setOpen(false);
                }}
                className={`flex cursor-pointer items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                  selected ? "font-semibold text-orange-500" : ""
                }`}
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
