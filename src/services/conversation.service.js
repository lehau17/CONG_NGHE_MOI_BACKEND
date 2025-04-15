import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const createConversation = async (userId, targetUserId) => {
    const participants = [userId, targetUserId].sort(); // để tránh tạo trùng

    let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
        conversation = await Conversation.create({ participants });
    }

    return conversation;
};


export const getMyConversations = async (userId) => {
    const conversations = await Conversation.find({ participants: userId })
        .populate("participants", "fullName avatar _id")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName avatar _id phoneNumber",
            },
        })
        .lean();

    const updated = conversations.map((conv) => {
        const sender = conv.lastMessage?.sender;
        if (sender) {
            const isSelf = sender._id.toString() === userId.toString();
            sender.label = isSelf
                ? "Bạn"
                : sender.fullName?.trim().split(" ").slice(-1)[0] || "Người lạ";
        }
        return conv;
    });

    return updated;
};



export const getConversationById = async (conversationId) => {
    return await Conversation.findById(conversationId)
        .populate("participants", "fullName avatar _id")
        .populate("lastMessage");
};



export const getOrCreateFullConversation = async (userId, targetUserId) => {
    const participants = [userId, targetUserId].sort();
    console.log(userId, targetUserId)
    let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
        conversation = await Conversation.create({ participants });
    }

    // Lấy chi tiết conversation + messages
    const fullConversation = await Conversation.findById(conversation._id)
        .populate("participants", "fullName avatar _id")
        .populate("lastMessage");

    const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 })
        .populate("sender", "fullName avatar _id"); // lấy theo thứ tự tăng dần thời gian

    return { ...fullConversation.toObject(), messages };
};
