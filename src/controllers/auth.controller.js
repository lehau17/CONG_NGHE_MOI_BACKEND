import authService from "../services/auth.service.js";
import { CreatedResponse, SuccessResponse } from "../utils/response.js";

export const signup = async (req, res, next) => {
    new CreatedResponse(
        await authService.signUp(req.body),
        "Đăng ký thành công"
    ).response(res);
};

export const login = async (req, res, next) => {
    new SuccessResponse(
        await authService.login(req.body, res),
        "Đăng nhập thành công"
    ).response(res);
};

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Đăng xuất thành công" });
    } catch (error) {
        console.log("Lỗi tại logout controller:", error.message);
        res.status(500).json({ error: "Lỗi máy chủ" });
    }
};

export const sendOtp = async (req, res, next) => {
    new SuccessResponse(
        await authService.sendOtp(req.body),
        "Gửi OTP thành công"
    ).response(res);
};

export const resetPasswordWithOtp = async (req, res, next) => {
    new SuccessResponse(
        await authService.verifyOtpAndResetPassword(req.body),
        "Đặt lại mật khẩu thành công"
    ).response(res);
};

// ✅ Thêm mới xác thực OTP không đổi mật khẩu
export const verifyOtpOnly = async (req, res, next) => {
    const { phoneNumber, otp } = req.body;
    const isValid = await authService.verifyOtpOnly({ phoneNumber, otp });

    if (!isValid) {
        return res.status(400).json({ error: "OTP không hợp lệ" });
    }

    new SuccessResponse(
        { verified: true },
        "Xác minh OTP thành công"
    ).response(res);
};

export const requestOtpSignup = async (req, res, next) => {
    new SuccessResponse(
        await authService.requestOtpForSignup(req.body),
        "Gửi OTP đăng ký thành công"
    ).response(res);
};


export const requestOtpFotgotPassword = async (req, res, next) => {
    new SuccessResponse(
        await authService.requestOtpForForgotPassword(req.body),
        "Gửi OTP quên mật khẩu thành công"
    ).response(res);
};

export const verifyOtpFotgotpassword = async (req, res, next) => {
    new CreatedResponse(
        await authService.verifyOtpForFotgotPassword(req.body),
        "Đặt lại mật khẩu thành công, vui lòng kiểm tra email hoặc số điện thoại của bạn"
    ).response(res);
};
export const verifyOtpSignup = async (req, res, next) => {
    new CreatedResponse(
        await authService.verifyOtpForSignup(req.body),
        "Đăng ký thành công"
    ).response(res);
};

export const changePassword = async (req, res, next) => {
    new SuccessResponse(
        await authService.changePassword(req.user.user_id, req.body),
        "Đổi mật khẩu thành công"
    ).response(res);
};


