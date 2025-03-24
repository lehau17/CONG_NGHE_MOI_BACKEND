import jwt from "jsonwebtoken";

//Tạo token , kiểm tra cookiecookie
const generateTokenAndSetCookie = (userId,res)=>{
    const payload = { userId }
    const token = jwt.sign(payload,process.env.JWT_SECRET,{
        // Hạn token
        expiresIn:'15d' 
    });
    res.cookie("jwt",token,{
        maxAge: 15 * 24 * 60 * 60 * 1000,
        httpOnly: true ,
        sameSite : "strict",
        secure: process.env.NODE_ENV === "development"
    });
};

export default generateTokenAndSetCookie;