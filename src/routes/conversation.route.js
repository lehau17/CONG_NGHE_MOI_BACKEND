import express from "express";
import * as conversationController from "../controllers/conversation.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";

const conversationRouter = express.Router();

// conversationRouter.use(authenticationMiddleware.run)

conversationRouter.post("/",
    authenticationMiddleware.run,
    wrapperRequestHandle(conversationController.createConversation))
conversationRouter.get("/me",
    authenticationMiddleware.run,
    wrapperRequestHandle(conversationController.getMyConversations));
conversationRouter.get("/:id",
    authenticationMiddleware.run,
    wrapperRequestHandle(conversationController.getConversationDetail));
conversationRouter.post("/detail",
    authenticationMiddleware.run,
    wrapperRequestHandle(conversationController.getOrCreateConversationDetail))

export default conversationRouter;
