import * as conversationService from "../services/conversation.service.js";
import { BadRequestError } from "../utils/errorHandler.js";
import { SuccessResponse } from "../utils/response.js";

export const createConversation = async (req, res, next) => {
    const { targetUserId } = req.body;
    const conversation = await conversationService.createConversation(req.user.user_id, targetUserId);
    new CreatedResponse(conversation, "Tạo cuộc trò chuyện thành công").response(res);
};

export const getMyConversations = async (req, res, next) => {
    const conversations = await conversationService.getMyConversations(req.user.user_id);
    new SuccessResponse(conversations, "Danh sách cuộc trò chuyện").response(res);
};

export const getConversationDetail = async (req, res, next) => {
    const { id } = req.params;
    const conversation = await conversationService.getConversationById(id);
    new SuccessResponse(conversation, "Chi tiết cuộc trò chuyện").response(res);
};


export const getOrCreateConversationDetail = async (req, res, next) => {
    const { to } = req.body;

    if (!to) {
        throw new BadRequestError("Chưa truyền thông số body")
    }

    const detail = await conversationService.getOrCreateFullConversation(
        req.user.user_id,
        to
    );

    new SuccessResponse(detail, "Chi tiết cuộc trò chuyện").response(res);
};
