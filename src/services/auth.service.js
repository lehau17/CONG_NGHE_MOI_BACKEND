import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { TYPE_TOKEN } from "../types/jwt.js";
import { BadRequestError } from "../utils/errorHandler.js";
import TokenFactory from "../utils/tokenFactory.js";

class AuthService {
    async login({userName, passWord }, res) {
        const user = await User.findOne({ userName });
        if (!user) {
            throw new BadRequestError("User not exists")
        };
        const isPwd = await bcrypt.compare(passWord, user?.passWord || "");
        if (!isPwd) {
            throw new BadRequestError("Invalid password")
        };
        // generateTokenAndSetCookie(user._id, res);
        const { passWord: _, ...userResponse } = user._doc
        const accessToken = TokenFactory.createToken(TYPE_TOKEN.ACCESS_TOKEN, userResponse._id,  ["USER"])
        return {user: userResponse, accessToken}
    }


    async signUp({ fullName, userName, phoneNumber, email, gender, passWord }) {
        // Tìm tất cả user có userName, email hoặc phoneNumber
        const existingUsers = await User.find({
            $or: [{ userName }, { email }, { phoneNumber }]
        });

        // Kiểm tra từng giá trị
        if (existingUsers.length > 0) {
            const conflicts = [];

            existingUsers.forEach(user => {
                if (user.userName === userName) conflicts.push({userName : "Username already exists"});
                if (user.email === email) conflicts.push({email: "Email already exists"});
                if (user.phoneNumber === phoneNumber) conflicts.push({phoneNumber : "Phone number already exists"});
            });

            throw new BadRequestError(conflicts);
        }

        // Nếu không có user trùng, tiếp tục tạo user
        const hashedPassword = await bcrypt.hash(passWord, 10);

        const newUser = new User({
            fullName,
            userName,
            phoneNumber,
            email,
            gender,
            passWord: hashedPassword,
        });

        await newUser.save();

        return newUser; // Trả về thông tin user mới tạo
    }

}

const authService = new AuthService()

export default authService
