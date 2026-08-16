import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model("User", userSchema);
