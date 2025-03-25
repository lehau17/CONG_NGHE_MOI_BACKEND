import dotenv from "dotenv";
import express from "express";
import mongoDbConnection from "./config/mongoDB.config.js";
import globalErrorHandler from "./middlewares/globalHandleError.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRouter from "./routes/user.routes.js";
dotenv.config();
const app = () => {

    const app = express();
    mongoDbConnection.createConnection()


    app.use(express.json()) // phân tích các yêu cầu đến với dữ liệu JSON (từ req.body)

    app.use("/api/auth",authRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/user", userRouter)
    app.use(globalErrorHandler);
    return app
}

export default app;



