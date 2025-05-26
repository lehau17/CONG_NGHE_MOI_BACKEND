import pkg from 'agora-access-token';
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import globalErrorHandler from "./middlewares/globalHandleError.js";
import authRoutes from "./routes/auth.routes.js";
import contactRouter from "./routes/contact.routes.js";
import conversationRouter from "./routes/conversation.route.js";
import conversationGroupRouter from "./routes/conversationGroup.route.js";
import friendRequestRoutes from "./routes/friendRequest.route.js";
import messageRouter from './routes/message.routes.js';
import pendingGroupInvite from "./routes/pendingGroupInvite.route.js";
import uploadRouter from "./routes/upload.route.js";
import userRouter from "./routes/user.routes.js";
const { RtcRole, RtcTokenBuilder } = pkg;

dotenv.config();
const app = () => {

    const app = express();

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));
    app.use(compression());
    app.use(
        cors({
            origin: "*"
        })
    );

    app.use(express.json())

    app.use("/api/auth", authRoutes);
    app.use("/api/conversation", conversationRouter);
    app.use("/api/conversationGroup", conversationGroupRouter);
    app.use("/api/pendingGroupInvite", pendingGroupInvite);
    app.use("/api/message", messageRouter);
    app.use("/api/user", userRouter)
    app.use("/api/upload", uploadRouter);
    app.use("/api/friend-request", friendRequestRoutes);
    app.use("/api/contact", contactRouter)
    app.use('/api/agora', (req, res) => {
        const appId = process.env.AGORA_APP_ID;
        const appCertificate = process.env.AGORA_APP_CERT;
        const { channel, uid } = req.query; // uid ở đây là _id của Mongo
        console.log("DEBUG =>>>>", channel, uid, appId, appCertificate)
        if (!channel || !uid) {
            return res.status(400).json({ error: "Missing channel or uid" });
        }

        const role = RtcRole.PUBLISHER;
        const expireTimeSeconds = 3600000;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expireTimeSeconds;

        // ✅ Dùng buildTokenWithUserAccount nếu uid là string
        const token = RtcTokenBuilder.buildTokenWithAccount(
            appId,
            appCertificate,
            channel,
            uid.toString(),
            role,
            privilegeExpiredTs
        );

        return res.json({ token });
    });

    // handling
    app.use(globalErrorHandler);
    return app
}

export default app;



