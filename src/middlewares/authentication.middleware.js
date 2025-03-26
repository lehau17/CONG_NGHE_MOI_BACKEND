import jwt from "jsonwebtoken";
import envConfig from "../config/env.config.js";
import { UnauthorizedError } from "../utils/errorHandler.js";

class AuthenticationMiddleware {
    run(req, res, next) {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            next(new UnauthorizedError("Không truyền Token."));
        }

        const [bearer, token] = authHeader.split(" ");
        if (bearer.toLowerCase() !== "bearer") {
            next(new UnauthorizedError("Token không hợp lệ."));
        }

        if (!token) {
            next(new UnauthorizedError("Thiếu token xác thực."));
        }

        jwt.verify(token, envConfig.JWT_SECRET, (err, decoded) => {
            if (err) {
                next(new UnauthorizedError("Token không hợp lệ hoặc đã hết hạn."));
            }
            req.user = decoded;
        });
        next();
    }
}


const authenticationMiddleware = new AuthenticationMiddleware()
export default authenticationMiddleware
