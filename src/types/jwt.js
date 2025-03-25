import jwt from "jsonwebtoken";
import { v4 } from 'uuid';
import envConfig from '../config/env.config.js';
export class BaseToken {
    constructor(user_id, iat, exp, role) {
        this.user_id = user_id;
        this.iat = iat;
        this.exp = exp;
        this.role = role;
        this.jit = v4(); // Unique token ID
    }

    generateToken() {
        return jwt.sign({
            user_id: this.user_id, iat: this.iat,
            exp: this.exp, role: this.role,
            jit : this.jit
        }, envConfig.JWT_SECRET)
    }
}

export class AccessToken extends BaseToken {
    constructor(user_id, role) {
        const iat = Date.now();
        const exp = iat + 15 * 24 * 60 * 60 * 1000;
        super(user_id, iat, exp, role);
        this.type_token = "ACCESS_TOKEN";
    }
}

export class RefreshToken extends BaseToken {
    constructor(user_id, role) {
        const iat = Date.now();
        const exp = iat + 365 * 24 * 60 * 60 * 1000;
        super(user_id, iat, exp, role);
        this.type_token = "REFRESH_TOKEN";
    }
}


export const TYPE_TOKEN = {
    "ACCESS_TOKEN": "ACCESS_TOKEN",
    "REFRESH_TOKEN": "REFRESH_TOKEN"
}
