/**
 * Seeds MongoDB with the deterministic sample activities so the app has real
 * data to read from Atlas. Idempotent: clears the collection, then re-inserts.
 *
 *   npm run seed
 *
 * Reads MONGODB_URI from .env.local (loaded the same way Next does).
 */
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { Activity } from "../lib/models/Activity";
import { getSampleActivities } from "../lib/sampleData";

// Load .env.local (and friends) before we touch process.env.
loadEnvConfig(process.cwd());

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set — add it to .env.local first.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const docs = getSampleActivities().map((a) => ({
    stravaId: a.stravaId,
    name: a.name,
    type: a.type,
    startDate: new Date(a.startDate),
    distance: a.distance,
    movingTime: a.movingTime,
    elapsedTime: a.elapsedTime,
    totalElevationGain: a.totalElevationGain,
    averageSpeed: a.averageSpeed,
    averageHeartrate: a.averageHeartrate,
  }));

  await Activity.deleteMany({});
  await Activity.insertMany(docs);
  console.log(`Seeded ${docs.length} activities`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
