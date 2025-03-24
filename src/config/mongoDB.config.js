
import mongoose from "mongoose";
class MongoDbConnection {

    constructor() {
        this.mongoose = mongoose;
        // createConnection()
    }

    createConnection() {
        mongoose.connect(this.url, {
            useNewUrlParser: true
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
