import express from "express";
import * as conversationController from "../controllers/conversation.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const conversationRouter = express.Router();

// conversationRouter.use(authenticationMiddleware.run)

conversationRouter.post("/",
    authenticationMiddleware.run,
    conversationController.createConversation);
conversationRouter.get("/me",
    authenticationMiddleware.run,
    conversationController.getMyConversations);
conversationRouter.get("/:id",
    authenticationMiddleware.run,
    conversationController.getConversationDetail);
conversationRouter.post("/detail",
    authenticationMiddleware.run,
    conversationController.getOrCreateConversationDetail);

export default conversationRouter;
