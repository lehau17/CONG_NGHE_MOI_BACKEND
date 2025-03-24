import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
dotenv.config();
const app = () => {

    const app = express();


    app.use(express.json()) // phân tích các yêu cầu đến với dữ liệu JSON (từ req.body)

    app.use("/api/auth",authRoutes);
    app.use("/api/messages",messageRoutes);
    return app
}

export default app;



