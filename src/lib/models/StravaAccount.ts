import { Schema, model, models, type Model } from "mongoose";

/**
 * Stores the OAuth tokens for a connected Strava athlete so we can sync without
 * re-authorizing. One document per athlete; this app analyzes a single account.
 */
export interface StravaAccountDoc {
  athleteId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds — when the access token expires
}

const StravaAccountSchema = new Schema<StravaAccountDoc>({
  athleteId: { type: Number, required: true, unique: true, index: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresAt: { type: Number, required: true },
});

export const StravaAccount: Model<StravaAccountDoc> =
  (models.StravaAccount as Model<StravaAccountDoc>) ??
  model<StravaAccountDoc>("StravaAccount", StravaAccountSchema);
