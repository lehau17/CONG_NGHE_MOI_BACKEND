import Conversation from "../models/conversation.model.js";
import * as messageService from "../services/message.service.js";
import appSocket from "../socketIO.js";
import { CreatedResponse, SuccessResponse } from "../utils/response.js";

export const sendMessage = async (req, res, next) => {
    try {
        const { conversationId, content, type } = req.body;
        const senderId = req.user.user_id;

        // 1. Tạo tin nhắn trong DB
        const message = await messageService.createMessage({
            conversationId,
            sender: senderId,
            content,
            type
        });

        // 2. Gửi realtime theo 2 cách:
        //  a) Emit đến tất cả socket đã join room (room = conversationId)
        appSocket.emitToRoom(conversationId, "new-message", message);

        //  b) Emit trực tiếp đến user (dự phòng nếu họ chưa join room)
        const { participants } = await Conversation.findById(conversationId);
        participants.forEach(participantId => {
            if (participantId.toString() !== senderId.toString()) {
                appSocket.emitToUser(participantId.toString(), "new-message", message);
            }
        });

        // 3. Gửi response về client
        new CreatedResponse(message, "Gửi tin nhắn thành công").response(res);
    } catch (err) {
        next(err);
    }
};

export const getConversationMessages = async (req, res, next) => {
    const { conversationId } = req.params;
    const messages = await messageService.getMessagesByConversation(conversationId);
    new SuccessResponse(messages, "Danh sách tin nhắn").response(res);
};
