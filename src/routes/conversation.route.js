import express from "express";
import * as conversationController from "../controllers/conversation.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const conversationRouter = express.Router();

conversationRouter.use(authenticationMiddleware.run)

conversationRouter.post("/", conversationController.createConversation);
conversationRouter.get("/me", conversationController.getMyConversations);
conversationRouter.get("/:id", conversationController.getConversationDetail);
conversationRouter.post("/detail", conversationController.getOrCreateConversationDetail);

export default conversationRouter;
