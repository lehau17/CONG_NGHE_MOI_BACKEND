import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import appSocket from "../socketIO.js";
import { BadRequestError } from "../utils/errorHandler.js";

export const createMessage = async (body, me_id) => {
    const conversation = await Conversation.findById(body.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const message = await Message.create({
        ...body,
        conversationId: new mongoose.Types.ObjectId(body.conversationId)
    });


    conversation.lastMessage = message._id;
    await conversation.save();

    const [populatedMessage, populatedConversation] = await Promise.all(
        [(await message.populate("sender", "_id fullName phoneNumber avatar")).populate("replyTo"),
        Conversation.findById(body.conversationId)
            .populate("participants.user", "_id fullName avatar")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender",
                    select: "_id fullName phoneNumber avatar"
                }
            })
            .lean()
        ])




    if (populatedConversation?.participants) {
        populatedConversation.participants.forEach((participant) => {
            const isMe = participant.user._id.toString() === me_id.toString();
            const sender = populatedConversation?.lastMessage?.sender;

            appSocket.emitToUser(participant.user._id.toString(), "update-chat-list", {
                ...populatedConversation,
                participants: populatedConversation.participants.map(e => { return { deletedAt: e.deletedAt, ...e.user } }),
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


    return populatedMessage;
};


export const getMessagesByConversation = async (conversationId, currentUserId) => {
    // 1. Lấy conversation + thời điểm user hiện tại xoá
    const conversation = await Conversation.findById(conversationId)
        .select("participants");

    if (!conversation) throw new Error("Conversation not found");

    const participant = conversation.participants.find(p =>
        p.user.toString() === currentUserId.toString()
    );

    const deletedAt = participant?.deletedAt || null;

    // 2. Truy vấn tin nhắn sau thời điểm deletedAt (nếu có)
    const filter = {
        conversationId,
        ...(deletedAt ? { createdAt: { $gt: deletedAt } } : {})
    };

    const messages = await Message.find(filter)
        .sort({ createdAt: 1 })
        .populate("sender", "_id fullName avatar")
        .populate("replyTo");

    return messages;
};

export const markConversationDeletedForUser = async (conversationId, userId) => {
    const now = new Date();
    const conversation = await Conversation.findOneAndUpdate(
        { _id: conversationId, "participants.user": userId },
        { $set: { "participants.$.deletedAt": now } },
        { new: true }
    ).select("participants");

    if (!conversation) throw new Error("Không tìm thấy cuộc trò chuyện hoặc không phải là thành viên.");

    return { conversationId, deletedAt: now };
};

export const recallMessage = async (messageId, userId) => {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Tin nhắn không tồn tại");

    // Chỉ người gửi mới được thu hồi
    if (message.sender.toString() !== userId.toString()) {
        throw new BadRequestError("Bạn không có quyền thu hồi tin nhắn này");
    }

    message.content = "Tin nhắn đã bị thu hồi";
    message.type = "text";
    message.fileMeta = [];

    await message.save();

    // Populate lại để hiển thị bên client
    return await message.populate("sender", "_id fullName avatar");
};

export const forwardMessage = async (messageId, targetConversationId) => {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) throw new Error("Message not found");

    // Tạo tin nhắn mới với nội dung từ tin nhắn gốc, nhưng với conversation mới
    const forwardedMessage = await Message.create({
        conversationId: targetConversationId,
        sender: originalMessage.sender,
        content: originalMessage.content,
        type: originalMessage.type,
        fileMeta: originalMessage.fileMeta
    });

    // Cập nhật lại lastMessage trong Conversation
    const targetConversation = await Conversation.findById(targetConversationId);
    if (!targetConversation) throw new Error("Target conversation not found");

    targetConversation.lastMessage = forwardedMessage._id;
    await targetConversation.save();

    // Trả về tin nhắn đã chuyển tiếp
    return forwardedMessage;
};
export const forwardManyMessage = async (messageId, targetConversationIds, me_id) => {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) throw new Error("Message not found");

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

            appSocket.emitToRoom(conversationId, "new-message", populatedMessage);

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: populatedMessage._id,
            });

            const populatedConversation = await Conversation.findById(conversationId)
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


