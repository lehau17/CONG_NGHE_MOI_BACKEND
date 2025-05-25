import express from "express";
import * as messageController from "../controllers/message.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";

const messageRouter = express.Router();

messageRouter.use(authenticationMiddleware.run);

messageRouter.post("/forward-many", wrapperRequestHandle(messageController.forwardManyMessage));
messageRouter.post("/send", wrapperRequestHandle(messageController.sendMessage));
messageRouter.get("/:conversationId", wrapperRequestHandle(messageController.getConversationMessages));
messageRouter.patch("/hide/:conversationId", wrapperRequestHandle(messageController.hideConversationForMe));
messageRouter.put("/recall/:messageId", wrapperRequestHandle(messageController.recallMessage));
messageRouter.post("/forward", wrapperRequestHandle(messageController.forwardMessage));

messageRouter.post("/:messageId/emoji", wrapperRequestHandle(messageController.sendEmoji));
messageRouter.put("/:messageId/emoji/toggle", wrapperRequestHandle(messageController.toggle));

messageRouter.delete("/:messageId/emoji", wrapperRequestHandle(messageController.revokeEmoji));
messageRouter.delete("/:messageId/emoji/all", wrapperRequestHandle(messageController.revokeEmoji));

export default messageRouter;
