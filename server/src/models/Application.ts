import mongoose, { Schema } from "mongoose";
import { applicationStatuses } from "../types/domain.js";

const interviewSchema = new Schema(
  {
    type: { type: String, required: true, trim: true, maxlength: 80 },
    dateTime: { type: Date, required: true },
    interviewer: { type: String, trim: true, maxlength: 120 },
    meetingLink: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 3000 },
    outcome: { type: String, trim: true, maxlength: 120 },
  },
  { timestamps: false },
);

const applicationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 160 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: applicationStatuses,
      default: "Saved",
      index: true,
    },
    sourceUrl: { type: String, trim: true, maxlength: 500 },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    appliedDate: { type: Date },
    nextActionDate: { type: Date, index: true },
    notes: { type: String, trim: true, maxlength: 5000 },
    interviews: { type: [interviewSchema], default: [] },
  },
  { timestamps: true },
);

applicationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
applicationSchema.index({ userId: 1, company: "text", role: "text" });

export const ApplicationModel = mongoose.model(
  "Application",
  applicationSchema,
);
