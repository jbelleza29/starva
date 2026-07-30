import { create } from "zustand";
import { persist } from "zustand/middleware";

export const FREE_SYNCS = 2;
const BASE_COOLDOWN_MS = 5 * 60 * 1000;

interface SyncState {
  count: number;
  lastSyncAt: number;
  cooldownMs: number;
  recordSync: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      count: 0,
      lastSyncAt: 0,
      cooldownMs: 0,
      recordSync: () => {
        const { count, cooldownMs } = get();
        const newCount = count + 1;
        const newCooldown =
          newCount <= FREE_SYNCS
            ? 0
            : newCount === FREE_SYNCS + 1
              ? BASE_COOLDOWN_MS
              : cooldownMs * 2;
        set({ count: newCount, lastSyncAt: Date.now(), cooldownMs: newCooldown });
      },
    }),
    { name: "starva_sync" },
  ),
);
