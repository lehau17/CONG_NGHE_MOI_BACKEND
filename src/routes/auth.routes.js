import express from "express";
import {
    changePassword,
    login,
    logout,
    requestOtpFotgotPassword,
    requestOtpSignup,
    resetPasswordWithOtp,
    sendOtp,
    signup,
    verifyOtpFotgotpassword,
    verifyOtpOnly,
    verifyOtpSignup
} from "../controllers/auth.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";
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
router.post("/forgot-password", wrapperRequestHandle(requestOtpFotgotPassword));
router.post("/forgot-password/verify-otp", wrapperRequestHandle(verifyOtpFotgotpassword));
export default router;
