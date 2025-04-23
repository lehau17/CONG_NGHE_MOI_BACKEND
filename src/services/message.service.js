import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import ConversationGroup from "../models/conversationGroup.model.js";
import Message from "../models/message.model.js";
import appSocket from "../socketIO.js";
import { BadRequestError } from "../utils/errorHandler.js";

export const createMessage = async (body, me_id) => {
    // 1. Tìm trong Conversation thường
    let conversation = await Conversation.findById(body.conversationId);

    let isGroup = false;

    // 2. Nếu không thấy, thử tìm trong ConversationGroup
    if (!conversation) {
        conversation = await ConversationGroup.findById(body.conversationId);
        isGroup = true;
    }

    if (!conversation) throw new Error("Conversation not found");

    // 3. Tạo tin nhắn
    const message = await Message.create({
        ...body,
        conversationId: new mongoose.Types.ObjectId(body.conversationId),
        isGroup
    });


    conversation.lastMessage = message._id;
    await conversation.save();

    const [populatedMessage, populatedConversation] = await Promise.all([
        message
            .populate([
                { path: "sender", select: "_id fullName phoneNumber avatar" },
                { path: "replyTo" }
            ]),
        conversation
            .populate([
                {
                    path: "participants.user",
                    select: "_id fullName avatar"
                },
                {
                    path: "lastMessage",
                    populate: {
                        path: "sender",
                        select: "_id fullName phoneNumber avatar"
                    }
                }
            ])
            .then(doc => doc.toObject()) // thay thế .lean() cho Document
    ]);




    if (populatedConversation?.participants) {
        const sender = populatedConversation?.lastMessage?.sender;

        // Trường hợp là nhóm thì emit 1 lần cho cả room
        if (isGroup) {
            appSocket.emitToRoom(conversation._id.toString(), "update-chat-list", {
                ...populatedConversation,
                participants: populatedConversation.participants.map(e => {
                    return { deletedAt: e.deletedAt, ...e.user };
                }),
                lastMessage: {
                    ...populatedConversation.lastMessage,
                    sender: {
                        ...sender,
                        label: sender?.fullName?.trim().split(" ").pop() || "Người lạ",
                    }
                }
            });
        } else {
            // Trường hợp chat 1-1 thì gửi riêng từng người
            populatedConversation.participants.forEach((participant) => {
                const isMe = participant.user._id.toString() === me_id.toString();

                appSocket.emitToUser(participant.user._id.toString(), "update-chat-list", {
                    ...populatedConversation,
                    participants: populatedConversation.participants.map(e => {
                        return { deletedAt: e.deletedAt, ...e.user };
                    }),
                    lastMessage: {
                        ...populatedConversation.lastMessage,
                        sender: {
                            ...sender,
                            label: isMe ? "Bạn" : (sender?.fullName?.trim().split(" ").pop() || "Người lạ"),
                        }
                    }
                });
            });
        }
    }



    return populatedMessage;
};


export const sendEmoji = async (messageId, typeEmoji, userId) => {
    const newMessage = await Message.findByIdAndUpdate(messageId, {
        $addToSet: { [`emoji.${typeEmoji}`]: userId }
    });
    return newMessage
};


export const revokeEmoji = async (messageId, typeEmoji, userId) => {
    const newMessage = await Message.findByIdAndUpdate(messageId, {
        $pull: { [`emoji.${typeEmoji}`]: userId }
    });
    return newMessage

};


export const getMessagesByConversation = async (conversationId, currentUserId) => {
    // 1. Tìm trong Conversation
    let conversation = await Conversation.findById(conversationId).select("participants");
    let isGroup = false;
    let role = null;

    // 2. Nếu không có, tìm trong ConversationGroup
    if (!conversation) {
        const group = await ConversationGroup.findById(conversationId).select("participants");
        if (!group) throw new Error("Conversation not found");
        
        conversation = group;
        isGroup = true;

        // Tìm role nếu là group
        const participant = group.participants.find(p =>
            p.user.toString() === currentUserId.toString()
        );
        role = participant?.role || null;
    }

    // Nếu là conversation cá nhân mà không tìm thấy
    if (!conversation) throw new BadRequestError("Conversation not found");

    // 3. Tìm participant tương ứng và thời điểm deletedAt
    const participant = conversation.participants.find(p =>
        p.user.toString() === currentUserId.toString()
    );

    const deletedAt = participant?.deletedAt || null;

    // 4. Truy vấn tin nhắn sau thời điểm deletedAt (nếu có)
    const filter = {
        conversationId,
        ...(deletedAt ? { createdAt: { $gt: deletedAt } } : {})
    };

    const messages = await Message.find(filter)
        .sort({ createdAt: 1 })
        .populate("sender", "_id fullName avatar")
        .populate("replyTo");

    // 5. Trả kết quả và role nếu là nhóm
    return {
        messages,
        ...(isGroup && { role })
    };
};


export const markConversationDeletedForUser = async (conversationId, userId) => {
    const now = new Date();

    // 1. Thử cập nhật trong Conversation
    let conversation = await Conversation.findOneAndUpdate(
        { _id: conversationId, "participants.user": userId },
        { $set: { "participants.$.deletedAt": now } },
        { new: true }
    ).select("participants");

    // 2. Nếu không có, thử cập nhật trong ConversationGroup
    if (!conversation) {
        conversation = await ConversationGroup.findOneAndUpdate(
            { _id: conversationId, "participants.user": userId },
            { $set: { "participants.$.deletedAt": now } },
            { new: true }
        ).select("participants");
    }

    // 3. Nếu vẫn không có thì báo lỗi
    if (!conversation) {
        throw new Error("Không tìm thấy cuộc trò chuyện hoặc không phải là thành viên.");
    }

    return { conversationId, deletedAt: now };
};

export const recallMessage = async (messageId, userId) => {
    const message = await Message.findById(messageId);
    if (!message) throw new BadRequestError("Tin nhắn không tồn tại");

    // Chỉ người gửi mới được thu hồi
    if (message.sender.toString() !== userId.toString()) {
        throw new BadRequestError("Bạn không có quyền thu hồi tin nhắn này");
    }

    message.content = "Tin nhắn đã bị thu hồi";
    message.type = "text";
    message.isRevoke = true
    message.fileMeta = [];

    await message.save();

    // Populate lại để hiển thị bên client
    return await message.populate("sender", "_id fullName avatar");
};

export const forwardMessage = async (messageId, targetConversationId) => {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) throw new BadRequestError("Message not found");

    const forwardedMessage = await Message.create({
        conversationId: targetConversationId,
        sender: originalMessage.sender,
        content: originalMessage.content,
        type: originalMessage.type,
        fileMeta: originalMessage.fileMeta
    });

    // Tìm targetConversation trong cả hai loại
    let targetConversation = await Conversation.findById(targetConversationId);
    if (!targetConversation) {
        targetConversation = await ConversationGroup.findById(targetConversationId);
    }
    if (!targetConversation) throw new Error("Target conversation not found");

    targetConversation.lastMessage = forwardedMessage._id;
    await targetConversation.save();

    return forwardedMessage;
};

export const forwardManyMessage = async (messageId, targetConversationIds, me_id) => {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) throw new BadRequestError("Message not found");

    const forwardedMessages = await Promise.all(
        targetConversationIds.map(async (conversationId) => {
            const forwardedMessage = await Message.create({
                conversationId,
                sender: originalMessage.sender,
                content: originalMessage.content,
                type: originalMessage.type,
                fileMeta: originalMessage.fileMeta,
            });

            const populatedMessage = await Message.findById(forwardedMessage._id)
                .populate("sender", "_id fullName phoneNumber avatar")
                .populate("replyTo");

            // Phát tin nhắn mới
            appSocket.emitToRoom(conversationId, "new-message", populatedMessage);

            // Tìm cả 2 loại conversation
            let conversation = await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: populatedMessage._id,
            }, { new: true });

            if (!conversation) {
                conversation = await ConversationGroup.findByIdAndUpdate(conversationId, {
                    lastMessage: populatedMessage._id,
                }, { new: true });
            }

            if (!conversation) return null;

            // Populate lại conversation sau update
            const populatedConversation = await (conversation instanceof Conversation
                ? Conversation.findById(conversationId)
                : ConversationGroup.findById(conversationId))
                .populate({
                    path: "participants.user",
                    select: "_id fullName avatar phoneNumber",
                })
                .populate({
                    path: "lastMessage",
                    populate: {
                        path: "sender",
                        select: "_id fullName avatar phoneNumber",
                    },
                });

            if (populatedConversation?.participants) {
                populatedConversation.participants.forEach((participant) => {
                    const isMe = participant.user._id.toString() === me_id.toString();
                    const sender = populatedConversation.lastMessage?.sender;

                    appSocket.emitToUser(participant.user._id.toString(), "update-chat-list", {
                        ...populatedConversation.toObject(),
                        participants: populatedConversation.participants.map(e => ({
                            deletedAt: e.deletedAt,
                            ...e.user.toObject(),
                        })),
                        lastMessage: {
                            ...populatedConversation.lastMessage.toObject(),
                            sender: {
                                ...sender.toObject(),
                                label: isMe ? "Bạn" : (sender?.fullName?.split(" ").pop() || "Người lạ"),
                            },
                        },
                    });
                });
            }

            return populatedMessage;
        })
    );

    return true;
};


