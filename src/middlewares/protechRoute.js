import jwt, { decode } from "jsonwebtoken";
import User from "../models/user.model.js";
import envConfig from "../config/env.config.js";

const protectRoute = async (req, res, next) => {
  try {
      let token = req.cookies?.jwt || 
                 req.headers?.authorization?.replace('Bearer ', '') || 
                 req.body?.token;

      if (!token) {
          return res.status(401).json({ error: "Unauthorized - No token provided" });
      }
      const decoded = jwt.verify(token, envConfig.JWT_SECRET);
      console.log("Decoded token:", decoded);
      const user = await User.findById(decoded.user_id).select("-password");
      if(!user){
        return res.status(404).json({ error: "User not found" });
      }
      req.user = user;
      console.log("User assigned to req.user:", req.user); 
      next();
  } catch (error) {
      console.error("JWT Error Details:", error);
      if (error.name === "JsonWebTokenError") {
          return res.status(401).json({ error: "Invalid token format" });
      }
      next(error);
  }
};

export default protectRoute;