import Message from "../models/message.model.js";
import * as messageService from "../services/message.service.js";
import appSocket from "../socketIO.js";
import { CreatedResponse, SuccessResponse } from "../utils/response.js";

export const sendMessage = async (req, res, next) => {
    const senderId = req.user.user_id;

    // 1. Tạo tin nhắn trong DB
    const message = await messageService.createMessage({
        ...req.body,
        sender: senderId,
    }, req.user.user_id);

    appSocket.emitToRoom(req.body.conversationId, "new-message", message);
    new CreatedResponse(message, "Gửi tin nhắn thành công").response(res);

};


export const toggle = async (req, res, next) => {
    const { messageId } = req.params;
    const { typeEmoji } = req.body;
    const userId = req.user.user_id;

    if (!typeEmoji) throw new BadRequestError("Thiếu typeEmoji");

    const updated = await messageService.toggleEmoji(messageId, typeEmoji, userId)
    // ✅ Emit socket về room
    appSocket.emitToRoom(updated.conversationId.toString(), "emoji-updated", updated);

    new SuccessResponse(updated, "Success").response(res);
};

export const getConversationMessages = async (req, res, next) => {
    const { conversationId } = req.params;
    const currentUserId = req.user.user_id;

    const messages = await messageService.getMessagesByConversation(conversationId, currentUserId);
    new SuccessResponse(messages, "Danh sách tin nhắn").response(res);
};

export const hideConversationForMe = async (req, res, next) => {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const result = await messageService.markConversationDeletedForUser(conversationId, userId);
    new SuccessResponse(result, "Đã ẩn đoạn chat thành công").response(res);
};

export const recallMessage = async (req, res, next) => {
    const { messageId } = req.params;
    const userId = req.user.user_id;

    const updatedMessage = await messageService.recallMessage(messageId, userId);

    // Gửi realtime để 2 bên cập nhật tin nhắn đã bị thu hồi
    appSocket.emitToRoom(updatedMessage.conversationId.toString(), "message-recalled", updatedMessage);

    new SuccessResponse(updatedMessage, "Thu hồi tin nhắn thành công").response(res);
};


export const sendEmoji = async (req, res, next) => {
    const { messageId } = req.params;
    const { typeEmoji } = req.body;
    const userId = req.user.user_id;

    if (!typeEmoji) throw new BadRequestError("Thiếu typeEmoji");

    const updated = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { [`emoji.${typeEmoji}`]: userId } },
        { new: true }
    ).populate("sender", "_id fullName avatar");

    // ✅ Emit socket về room
    appSocket.emitToRoom(updated.conversationId.toString(), "emoji-updated", updated);

    new SuccessResponse(updated, "Success").response(res);
};



export const revokeEmoji = async (req, res, next) => {
    const { messageId } = req.params;
    const { typeEmoji } = req.body;
    const userId = req.user.user_id;

    if (!typeEmoji) throw new BadRequestError("Thiếu typeEmoji");

    const updated = await Message.findByIdAndUpdate(
        messageId,
        { $pull: { [`emoji.${typeEmoji}`]: userId } },
        { new: true }
    ).populate("sender", "_id fullName avatar");

    // ✅ Emit socket về room
    appSocket.emitToRoom(updated.conversationId.toString(), "emoji-updated", updated);

    new SuccessResponse(updated, "Success").response(res);
};


export const forwardMessage = async (req, res, next) => {
    const { messageId, targetConversationIds } = req.body;
    const me_id = req.user.user_id;
    try {
        const forwardedMessage = await messageService.forwardManyMessage(messageId, targetConversationIds, me_id);
        new CreatedResponse(forwardedMessage, "Tin nhắn đã được chuyển tiếp thành công").response(res);
    } catch (error) {
        next(error);
    }
};


export const forwardManyMessage = async (req, res, next) => {
    const { messageId, targetConversationIds } = req.body;

    try {
        const result = await messageService.forwardManyMessage(
            messageId,
            targetConversationIds,
            req.user.user_id
        );
        new SuccessResponse(result, "Tin nhắn đã được chuyển tiếp thành công").response(res);
    } catch (error) {
        next(error); // đảm bảo middleware xử lý lỗi sẽ hoạt động
    }
};

