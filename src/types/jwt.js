import { v4 as uuidv4 } from 'uuid';

class BaseToken {
    constructor(user_id, iat, exp, role) {
        this.user_id = user_id;
        this.iat = iat;
        this.exp = exp;
        this.role = role;
        this.jit = uuidv4();
    }
}

class AccessToken extends BaseToken {
    constructor(user_id, iat, exp, role) {
        super(user_id, iat, exp, role);
        this.type_token = "ACCESS_TOKEN";
    }
}

class RefreshToken extends BaseToken {
    constructor(user_id, iat, exp, role) {
        super(user_id, iat, exp, role);
        this.type_token = "REFRESH_TOKEN";
    }
}

// Factory Pattern
class TokenFactory {
    static createToken(type, user_id, iat, exp, role) {
        if (type === "ACCESS_TOKEN") {
            return new AccessToken(user_id, iat, exp, role);
        } else if (type === "REFRESH_TOKEN") {
            return new RefreshToken(user_id, iat, exp, role);
        } else {
            throw new Error("Invalid token type");
        }
    }
}


export default TokenFactory;
