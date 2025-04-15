// src/services/auth.service.js
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { TYPE_TOKEN } from "../types/jwt.js";
import { BadRequestError } from "../utils/errorHandler.js";
import generatePassword from '../utils/generatepassword.js';
import generateTokenAndSetCookie from "../utils/generateToken.js";
import { generateOtp, sendSMS, verifyOtp } from "../utils/otpUtils.js";
import tempForfotPasswordStore from "../utils/tempForgotPasswordStore.js";
import tempSignupStore from "../utils/tempSignupStore.js";
import TokenFactory from "../utils/tokenFactory.js";
class AuthService {
    async login({ phoneNumber, passWord }, res) {
        const user = await User.findOne({ phoneNumber });
        if (!user) throw new BadRequestError("User not exists");

        const isPwd = await bcrypt.compare(passWord, user?.passWord || "");
        if (!isPwd) throw new BadRequestError("Invalid password");

        const { passWord: _, ...userResponse } = user._doc;
        generateTokenAndSetCookie(user._id, res) // cookie
        const accessToken = TokenFactory.createToken(
            TYPE_TOKEN.ACCESS_TOKEN,
            userResponse._id,
            ["USER"]
        );

        return { user: userResponse, access_token: accessToken };
    }

    async signUp({ fullName, userName, phoneNumber, email, gender, passWord }) {
        const existingUsers = await User.find({
            $or: [{ userName }, { email }, { phoneNumber }]
        });

        if (existingUsers.length > 0) {
            const conflicts = [];
            existingUsers.forEach(user => {
                if (user.userName === userName) conflicts.push({ userName: "Username already exists" });
                if (user.email === email) conflicts.push({ email: "Email already exists" });
                if (user.phoneNumber === phoneNumber) conflicts.push({ phoneNumber: "Phone number already exists" });
            });
            throw new BadRequestError("Đăng ký thông tin thất bại", conflicts);
        }

        const hashedPassword = await bcrypt.hash(passWord, 10);
        const newUser = new User({ fullName, userName, phoneNumber, email, gender, passWord: hashedPassword });
        await newUser.save();
        return newUser;
    }

    async sendOtp({ phoneNumber }) {
        const user = await User.findOne({ phoneNumber });
        if (!user) throw new BadRequestError("Số điện thoại không tồn tại");

        await generateOtp(phoneNumber);
        return { message: "Mã OTP đã được gửi qua SMS." };
    }

    async verifyOtpAndResetPassword({ phoneNumber, otp, newPassword }) {
        const isValid = verifyOtp(phoneNumber, otp);
        if (!isValid) throw new BadRequestError("OTP không hợp lệ");

        const user = await User.findOne({ phoneNumber });
        if (!user) throw new BadRequestError("Số điện thoại không tồn tại");

        user.passWord = await bcrypt.hash(newPassword, 10);
        await user.save();
        return { message: "Đổi mật khẩu thành công" };
    }

    // Thêm vào trong class AuthService trong auth.service.js
    async verifyOtpOnly({ phoneNumber, otp }) {
        const isValid = verifyOtp(phoneNumber, otp);
        if (!isValid) {
            throw new BadRequestError("OTP không hợp lệ");
        }
        return { verified: true };
    }

    async requestOtpForSignup({ fullName, userName, phoneNumber, email, gender, passWord }) {
        // Kiểm tra trùng thông tin
        const existingUsers = await User.find({
            $or: [{ userName }, { email }, { phoneNumber }]
        });
        if (existingUsers.length > 0) {
            const conflicts = [];
            existingUsers.forEach(user => {
                if (user.userName === userName) conflicts.push({ userName: "Username already exists" });
                if (user.email === email) conflicts.push({ email: "Email already exists" });
                if (user.phoneNumber === phoneNumber) conflicts.push({ phoneNumber: "Phone number already exists" });
            });
            throw new BadRequestError("Thông tin đăng ký không hợp lệ.", conflicts);
        }

        // Gửi OTP & lưu info tạm
        await generateOtp(phoneNumber);
        if (tempSignupStore.has(phoneNumber)) {
            throw new BadRequestError("OTP đã được gửi đến số điện thoại này trong vòng 5 phút qua.");
        }
        tempSignupStore.set(phoneNumber, { fullName, userName, phoneNumber, email, gender, passWord });

        return { phoneNumber }
    }


    async requestOtpForForgotPassword({ phoneNumber }) {
        // Kiểm tra trùng thông tin
        const existingUsers = await User.findOne({
            phoneNumber
        });
        if (!existingUsers || existingUsers.status === "deactive") {
            throw new BadRequestError("Số điện thoại không tồn tại hoặc đã bị khóa.");
        }

        // Gửi OTP & lưu info tạm
        await generateOtp(phoneNumber);
        if (tempForfotPasswordStore.has(phoneNumber)) {
            throw new BadRequestError("OTP đã được gửi đến số điện thoại này trong vòng 5 phút qua.");
        }
        tempForfotPasswordStore.set(phoneNumber, 1);

        return { phoneNumber }
    }

    async verifyOtpForSignup({ phoneNumber, otp }) {
        const isValid = verifyOtp(phoneNumber, otp);
        if (!isValid) throw new BadRequestError("OTP không hợp lệ");

        const userData = tempSignupStore.get(phoneNumber);
        if (!userData) throw new BadRequestError("Thông tin đăng ký không tồn tại hoặc đã hết hạn");

        const hashedPassword = await bcrypt.hash(userData.passWord, 10);
        const newUser = new User({ ...userData, passWord: hashedPassword });
        await newUser.save();

        tempSignupStore.delete(phoneNumber); // Xóa sau khi tạo thành công
        // generateTokenAndSetCookie(newUser._id, res)
        const accessToken = TokenFactory.createToken(
            TYPE_TOKEN.ACCESS_TOKEN,
            newUser._id,
            ["USER"]
        );
        return { user: newUser, access_token: accessToken };
    }


    async verifyOtpForFotgotPassword({ phoneNumber, otp }) {
        const isValid = verifyOtp(phoneNumber, otp);
        if (!isValid) throw new BadRequestError("OTP không hợp lệ");

        const userData = tempForfotPasswordStore.get(phoneNumber);
        if (!userData) throw new BadRequestError("Thông tin đăng ký không tồn tại hoặc đã hết hạn");



        const newPassword = generatePassword();

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const foundUser = await User.findOneAndUpdate({ phoneNumber }, { passWord: hashedPassword }, { new: true });

        tempSignupStore.delete(phoneNumber); // Xóa sau khi tạo thành công
        // generateTokenAndSetCookie(newUser._id, res)
        const accessToken = TokenFactory.createToken(
            TYPE_TOKEN.ACCESS_TOKEN,
            foundUser._id,
            ["USER"]
        );
        await sendSMS(phoneNumber, `Mật khẩu mới của bạn là: ${newPassword}. `);
        return { user: foundUser, access_token: accessToken };
    }

    async changePassword(userId, { oldPassword, newPassword, confirmPassword }) {
        const user = await User.findById(userId);
        if (!user) throw new BadRequestError("Người dùng không tồn tại");

        const isMatch = bcrypt.compareSync(oldPassword, user.passWord);
        if (!isMatch) throw new BadRequestError("Mật khẩu cũ không chính xác");

        if (newPassword !== confirmPassword) {
            throw new BadRequestError("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        user.passWord = await bcrypt.hash(newPassword, 10);
        await user.save();

        return { message: "Mật khẩu đã được cập nhật" };
    }



}

const authService = new AuthService();
export default authService;
