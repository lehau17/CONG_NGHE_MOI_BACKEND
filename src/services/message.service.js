import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const createMessage = async ({ conversationId, sender, content, type = "text" }) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const message = await Message.create({
        conversationId,
        sender,
        content,
        type
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    return message;
};

export const getMessagesByConversation = async (conversationId) => {
    return await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .populate("sender", "fullName avatar");
};
