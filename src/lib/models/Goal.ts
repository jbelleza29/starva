import { Schema, model, models, type Model } from "mongoose";

export interface GoalDoc {
  activityType: string; // "Run" | "Ride" | "All" | etc.
  metric: "distance" | "time";
  target: number; // meters for distance, seconds for time
  month: string;  // YYYY-MM — which month this goal tracks
  createdAt: Date;
}

const GoalSchema = new Schema<GoalDoc>({
  activityType: { type: String, required: true },
  metric:       { type: String, required: true },
  target:       { type: Number, required: true },
  month:        { type: String, required: true, index: true },
  createdAt:    { type: Date,   default: Date.now },
});

export const Goal: Model<GoalDoc> =
  (models.Goal as Model<GoalDoc>) ?? model<GoalDoc>("Goal", GoalSchema);
