import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signup = async (req, res, next) => {
        const { fullName, userName, passWord, confirmPassword, gender, email, phoneNumber } = req.body;
        // Kiểm tra lại mật khẩu
        if (passWord !== confirmPassword) {
            return res.status(400).json({ error: "Password dont match" });
        }
        // kiẻm tra userName
        const user = await User.findOne({ userName });
        if (user) {
            return res.status(400).json({ error: "UserName already exists" });
        }
        //check phone
        // check email
        // hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(passWord, salt);
        //avata
        const maleAvatar = `https://avatar.iran.liara.run/public/boy?username=${userName}`;
        const femaleAvatar = `https://avatar.iran.liara.run/public/girl?username=${userName}`;

        // Tạo user mới
        const newUser = new User({
            fullName,
            userName,
            passWord: hashedPassword,
            gender,
            email,
            phoneNumber,
            avatar: gender === 'male' ? maleAvatar : femaleAvatar
        })
        //Tạo token
        generateTokenAndSetCookie(newUser._id, res);

        await newUser.save();

        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            userName: newUser.userName,
            phoneNumber: newUser.phoneNumber,
            email: newUser.email,
            avatar: newUser.avatar
        });


}
export const login = async (req, res, next) => {
    try {
        const { userName, passWord } = req.body;
        const user = await User.findOne({ userName });
        if (!user) {
            return res.status(400).json({ error: "username not found" });
        };
        const isPwd = await bcrypt.compare(passWord, user?.passWord || "");
        if (!isPwd) {
            return res.status(400).json({ error: "invalid password" });
        };

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            userName: user.userName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            avatar: user.avatar
        })

        console.log("login successfully")
    } catch (error) {
        console.log("error in login controller", error.message)
        res.status(500).json({ error: "internal server error" })
    }
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
