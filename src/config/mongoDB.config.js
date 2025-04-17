
import mongoose from "mongoose";
import envConfig from "./env.config.js";
class MongoDbConnection {

    constructor() {
        this.mongoose = mongoose;
        this.url = envConfig.MONGO_URL
        // createConnection()
    }

    async createConnection() {
        await mongoose.connect(this.url, {})
        console.log("Connect to db")
    }

    getConnection() {
        return this.mongoose;
    }
}

const mongoDbConnection = new MongoDbConnection();
export default mongoDbConnection;
