import express from "express";
import {
  login,
  logout,
  signup,
  sendOtp,
  resetPasswordWithOtp,
  verifyOtpOnly
} from "../controllers/auth.controller.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";

const router = express.Router();

router.post("/log-in", wrapperRequestHandle(login));
router.post("/logout", wrapperRequestHandle(logout));
router.post("/sign-up", wrapperRequestHandle(signup));
router.post("/send-otp", wrapperRequestHandle(sendOtp));
router.post("/verify-otp", wrapperRequestHandle(verifyOtpOnly)); // 🔥 Thêm endpoint xác minh OTP
router.post("/reset-password", wrapperRequestHandle(resetPasswordWithOtp));

export default router;
