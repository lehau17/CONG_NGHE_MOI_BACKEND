import express from "express";
import {
  login,
  logout,
  signup,
  sendOtp,
  resetPasswordWithOtp,
  verifyOtpOnly,
  requestOtpSignup,
  verifyOtpSignup,
  changePassword 
} from "../controllers/auth.controller.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";
const router = express.Router();

router.post("/log-in", wrapperRequestHandle(login));
router.post("/logout", wrapperRequestHandle(logout));
router.post("/sign-up", wrapperRequestHandle(signup));
router.post("/send-otp", wrapperRequestHandle(sendOtp));
router.post("/verify-otp", wrapperRequestHandle(verifyOtpOnly)); // 🔥 Thêm endpoint xác minh OTP
router.post("/reset-password", wrapperRequestHandle(resetPasswordWithOtp));
router.post("/sign-up/request-otp", wrapperRequestHandle(requestOtpSignup));
router.post("/sign-up/verify-otp", wrapperRequestHandle(verifyOtpSignup));
router.post("/change-password", authenticationMiddleware.run, wrapperRequestHandle(changePassword));

export default router;
