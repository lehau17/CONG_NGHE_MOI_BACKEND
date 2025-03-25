
import mongoose from "mongoose";
import envConfig from "./env.config.js";
class MongoDbConnection {

    constructor() {
        this.mongoose = mongoose;
        this.url =  envConfig.MONGO_URL
        // createConnection()
    }

    createConnection() {
        mongoose.connect(this.url, {
        }).then(() => {
            console.log("Successfully connected to the database");
        }).catch(err => {
            console.log('Could not connect to the database. Exiting now...', err);
            process.exit();
        });
    }

    getConnection() {
        return this.mongoose;
    }
}

const mongoDbConnection = new MongoDbConnection();
export default mongoDbConnection;
