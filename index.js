import mongoDbConnection from "./src/config/mongoDB.config.js";
import appSocket from "./src/socketIO.js";

const PORT = process.env.PORT || 5000;
appSocket.server.listen(PORT, () => {
    mongoDbConnection.createConnection()

    console.log(`✅ Server with Socket.IO is running at http://localhost:${PORT}`);
});
