import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import globalErrorHandler from "./middlewares/globalHandleError.js";
import authRoutes from "./routes/auth.routes.js";
import contactRouter from "./routes/contact.routes.js";
import conversationRouter from "./routes/conversation.route.js";
import friendRequestRoutes from "./routes/friendRequest.route.js";
import messageRouter from './routes/message.routes.js';
import uploadRouter from "./routes/upload.route.js";
import userRouter from "./routes/user.routes.js";

dotenv.config();
const app = () => {

    const app = express();

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    app.use(
        cors({
            origin: "*"
        })
    );

    app.use(express.json())

    app.use("/api/auth", authRoutes);
    app.use("/api/conversation", conversationRouter);
    app.use("/api/message", messageRouter);
    app.use("/api/user", userRouter)
    app.use("/api/upload", uploadRouter);
    app.use("/api/friend-request", friendRequestRoutes);
    app.use("/api/contact", contactRouter)

    // handling
    app.use(globalErrorHandler);
    return app
}

export default app;



