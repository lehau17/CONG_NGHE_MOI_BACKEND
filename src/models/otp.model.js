// models/otp.model.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  phoneNumber: String,
  otp: String,
  expiresAt: Date,
});

export default mongoose.model("Otp", otpSchema);
