import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import mongoDbConnection from "./config/mongoDB.config.js";
import globalErrorHandler from "./middlewares/globalHandleError.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRouter from "./routes/user.routes.js";
dotenv.config();
const app = () => {

    const app = express();
    mongoDbConnection.createConnection()

    app.use(cors({
      origin: true, // Cho phép tất cả domains
      credentials: true,
      exposedHeaders: ['set-cookie']
    }));
    
    app.use(express.json({ limit: '5mb' }));
    app.use(express.urlencoded({ extended: true, limit: '5mb' }));
    
    app.use(cookieParser());
    
    app.use("/api/auth",authRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/user", userRouter)
    app.use(globalErrorHandler);
    return app
}

export default app;



