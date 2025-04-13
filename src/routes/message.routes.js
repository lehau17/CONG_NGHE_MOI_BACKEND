import express from "express";
import * as messageController from "../controllers/message.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const messageRouter = express.Router();

messageRouter.use(authenticationMiddleware.run);

messageRouter.post("/send", messageController.sendMessage);
messageRouter.get("/:conversationId", messageController.getConversationMessages);

export default messageRouter;
