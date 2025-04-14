import express from "express";
import * as messageController from "../controllers/message.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";

const messageRouter = express.Router();

messageRouter.use(authenticationMiddleware.run);

messageRouter.post("/send", wrapperRequestHandle(messageController.sendMessage));
messageRouter.get("/:conversationId", wrapperRequestHandle(messageController.getConversationMessages));

export default messageRouter;
