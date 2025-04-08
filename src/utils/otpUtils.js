// src/utils/otpUtils.js
import vonage from "../config/vonage.config.js";

const otpStore = new Map();

export const generateOtp = async (phoneNumber) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phoneNumber, otp);
  setTimeout(() => otpStore.delete(phoneNumber), 5 * 60 * 1000);

  const from = process.env.VONAGE_BRAND || "Vonage";
  const to = "84" + phoneNumber.slice(1);
  const text = `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 5 phút.`;

  try {
    await vonage.sms.send({ to, from, text });
    console.log("OTP sent successfully to", to, from, text);
  } catch (err) {
    console.error("Failed to send OTP:", err);
    throw new Error("Không thể gửi OTP. Vui lòng thử lại sau.");
  }
  console.log(`✅ OTP cho ${phoneNumber}: ${otp} (hiệu lực 5 phút)`);
  return otp;
};

export const verifyOtp = (phoneNumber, otpInput) => {
  const validOtp = otpStore.get(phoneNumber);
  return validOtp === otpInput;
};