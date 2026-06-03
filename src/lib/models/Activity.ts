import { Schema, model, models, type Model } from "mongoose";

export interface ActivityDoc {
  stravaId: number;
  name: string;
  type: string;
  startDate: Date;
  distance: number; // meters
  movingTime: number; // seconds
  elapsedTime: number; // seconds
  totalElevationGain: number; // meters
  averageSpeed: number; // m/s
  averageHeartrate?: number; // bpm
}

const ActivitySchema = new Schema<ActivityDoc>({
  stravaId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true, index: true },
  startDate: { type: Date, required: true, index: true },
  distance: { type: Number, required: true },
  movingTime: { type: Number, required: true },
  elapsedTime: { type: Number, required: true },
  totalElevationGain: { type: Number, default: 0 },
  averageSpeed: { type: Number, default: 0 },
  averageHeartrate: { type: Number },
});

export const Activity: Model<ActivityDoc> =
  (models.Activity as Model<ActivityDoc>) ?? model<ActivityDoc>("Activity", ActivitySchema);
