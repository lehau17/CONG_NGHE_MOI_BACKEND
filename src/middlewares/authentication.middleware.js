import jwt from "jsonwebtoken";
import envConfig from "../config/env.config.js";
import { UnauthorizedError } from "../utils/errorHandler.js";

class AuthenticationMiddleware {
    run(req, res, next) {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                throw new UnauthorizedError("Không truyền Token.");
            }

            const [bearer, token] = authHeader.split(" ");
            if (!token || bearer.toLowerCase() !== "bearer") {
                throw new UnauthorizedError("Token không hợp lệ.");
            }

            jwt.verify(token, envConfig.JWT_SECRET, (err, decoded) => {
                if (err) {
                    return next(new UnauthorizedError("Token không hợp lệ hoặc đã hết hạn."));
                }

                req.user = decoded;
                console.log(decoded)
                next(); // ✅ Chỉ gọi next() khi xác thực thành công
            });
        } catch (error) {
            next(error);
        }
    }
}

const authenticationMiddleware = new AuthenticationMiddleware();
export default authenticationMiddleware;
