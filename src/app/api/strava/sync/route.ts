import { connectToDatabase } from "@/lib/db";
import { StravaAccount } from "@/lib/models/StravaAccount";
import { Activity } from "@/lib/models/Activity";
import { fetchActivities, mapStravaActivity, refreshAccessToken } from "@/lib/strava";

// How many seconds before expiry we proactively refresh.
const REFRESH_BUFFER = 5 * 60;

async function getValidAccessToken(): Promise<string> {
  const account = await StravaAccount.findOne();
  if (!account) throw new Error("No connected Strava account. Connect first.");

  const nowSecs = Math.floor(Date.now() / 1000);
  if (account.expiresAt - nowSecs > REFRESH_BUFFER) {
    return account.accessToken;
  }

  // Token is expired (or about to be) — refresh it.
  const fresh = await refreshAccessToken(account.refreshToken);
  await StravaAccount.updateOne(
    { _id: account._id },
    {
      $set: {
        accessToken: fresh.accessToken,
        refreshToken: fresh.refreshToken,
        expiresAt: fresh.expiresAt,
      },
    },
  );
  return fresh.accessToken;
}

/**
 * Fetches all activities from Strava and upserts them into MongoDB.
 * Uses stravaId as the unique key so re-syncing is idempotent.
 */
export async function POST() {
  try {
    await connectToDatabase();
    const accessToken = await getValidAccessToken();

    let page = 1;
    let totalUpserted = 0;

    // Paginate until Strava returns an empty page.
    while (true) {
      const activities = await fetchActivities(accessToken, page, 100);
      if (activities.length === 0) break;

      const ops = activities.map((a) => ({
        updateOne: {
          filter: { stravaId: a.id },
          update: { $set: mapStravaActivity(a) },
          upsert: true,
        },
      }));

      await Activity.bulkWrite(ops);
      totalUpserted += activities.length;
      page += 1;
    }

    return Response.json({ ok: true, synced: totalUpserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
