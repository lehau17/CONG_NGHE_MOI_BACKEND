import dotenv from "dotenv";
dotenv.config();

const enviroment = process.env.NODE_ENV || "development";

const envConfig = {
    "development": {
        "PORT": process.env.PORT || 5000,
        "MONGO_URL": process.env.MONGO_URL,
        "JWT_SECRET": process.env.JWT_SECRET
    },
    "production": {
        "PORT": process.env.PORT || 5000,
        "MONGO_URL": process.env.PRO_MONGO_URL,
        "JWT_SECRET": process.env.PRO_JWT_SECRET
    },
    "test": {
        "PORT": process.env.PORT || 5000,
        "MONGO_URL": process.env.STAGING_MONGO_URL,
        "JWT_SECRET": process.env.STAGING_JWT_SECRET
    }
}

export default envConfig[enviroment];
