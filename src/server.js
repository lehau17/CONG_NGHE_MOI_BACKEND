import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoDbConnection from "./config/mongoDB.config.js";
import globalErrorHandler from "./middlewares/globalHandleError.js";
import authRoutes from "./routes/auth.routes.js";
import friendRequestRoutes from "./routes/friendRequest.route.js";
import messageRoutes from "./routes/message.routes.js";
import uploadRouter from "./routes/upload.route.js";
import userRouter from "./routes/user.routes.js";
import io from "./socketIO.js";
dotenv.config();
const app = () => {

    const app = express();
    mongoDbConnection.createConnection()
    app.use(
        cors({
            origin: "*"
        })
    );


    io.on("connection", (socket) => {
        console.log("🟢 New client connected", socket.id);

        socket.on("disconnect", () => {
            console.log("🔌 Client disconnected", socket.id);
        });
    });

    app.use(express.json())

    app.use("/api/auth", authRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/user", userRouter)
    app.use("/api/upload", uploadRouter);
    app.use("/api/friend-request", friendRequestRoutes);

    // handling
    app.use(globalErrorHandler);
    return app
}

export default app;



