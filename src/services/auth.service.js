import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { BadRequestError } from "../utils/errorHandler.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";

class AuthService {
    async login({userName, passWord }) {
        const user = await User.findOne({ userName });
        if (!user) {
            throw new BadRequestError("User not exists")
        };
        const isPwd = await bcrypt.compare(passWord, user?.passWord || "");
        if (!isPwd) {
            throw new BadRequestError("Invalid password")
        };
        generateTokenAndSetCookie(user._id, res);
        const { passWord: _, ...userResponse } = user
        return userResponse
    }
}

const authService = new AuthService()

export default authService
