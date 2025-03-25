import { AccessToken, RefreshToken } from "../types/jwt.js";
import { BadRequestError } from "./errorHandler.js";

// Factory Pattern
class TokenFactory {
    static createToken(type, user_id, role) {
        if (type === "ACCESS_TOKEN") {
            return new AccessToken(user_id, role).generateToken()
        } else if (type === "REFRESH_TOKEN") {
            return new RefreshToken(user_id, role).generateToken()
        } else {
            throw new BadRequestError("Invalid token type");
        }
    }
}


export default TokenFactory;
