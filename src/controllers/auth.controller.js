import authService from "../services/auth.service.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import { CreatedResponse, SuccessResponse } from "../utils/response.js";

export const signup = async (req, res) => {
    new CreatedResponse(await authService
        .signUp(req.body), "Đăng Ký Thành Công"
    ).response(res)
}
export const login = async (req, res) => {
    new SuccessResponse(await authService
        .login(req.body, res), "Đăng Nhập Thành Công"
    ).response(res)
}

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ error: "logout successfully" })
    } catch (error) {
        console.log("error in signup controller", error.message)
        res.status(500).json({ error: "internal server error" })
    };
}
