import Conversation from "../models/conversation.model.js";
import * as messageService from "../services/message.service.js";
import appSocket from "../socketIO.js";
import { CreatedResponse, SuccessResponse } from "../utils/response.js";

export const sendMessage = async (req, res, next) => {
    const { conversationId, content, type } = req.body;
    const senderId = req.user.user_id;
    const message = await messageService.createMessage({ conversationId, sender: senderId, content, type });

    // Emit realtime to all other participants in the conversation
    const { participants } = await Conversation.findById(conversationId);
    participants.forEach(participantId => {
        if (participantId.toString() !== senderId.toString()) {
            appSocket.emitToUser(participantId.toString(), "new-message", message);
        }
    });

    new CreatedResponse(message, "Gửi tin nhắn thành công").response(res);
};

export const getConversationMessages = async (req, res, next) => {
    const { conversationId } = req.params;
    const messages = await messageService.getMessagesByConversation(conversationId);
    new SuccessResponse(messages, "Danh sách tin nhắn").response(res);
};
