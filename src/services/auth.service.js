// src/services/auth.service.js
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { TYPE_TOKEN } from "../types/jwt.js";
import { BadRequestError } from "../utils/errorHandler.js";
import TokenFactory from "../utils/tokenFactory.js";
import { generateOtp, verifyOtp } from "../utils/otpUtils.js";

class AuthService {
  async login({ phoneNumber, passWord }, res) {
    const user = await User.findOne({ phoneNumber });
    if (!user) throw new BadRequestError("User not exists");

    const isPwd = await bcrypt.compare(passWord, user?.passWord || "");
    if (!isPwd) throw new BadRequestError("Invalid password");

    const { passWord: _, ...userResponse } = user._doc;
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
      throw new BadRequestError(conflicts);
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

}

const authService = new AuthService();
export default authService;