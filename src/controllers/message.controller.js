import * as messageService from "../services/message.service.js";
import appSocket from "../socketIO.js";
import { CreatedResponse, SuccessResponse } from "../utils/response.js";

export const sendMessage = async (req, res, next) => {
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
    new CreatedResponse(message, "Gửi tin nhắn thành công").response(res);

};

export const getConversationMessages = async (req, res, next) => {
    const { conversationId } = req.params;
    const messages = await messageService.getMessagesByConversation(conversationId);
    new SuccessResponse(messages, "Danh sách tin nhắn").response(res);
};
