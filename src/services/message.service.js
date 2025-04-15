import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import appSocket from "../socketIO.js";

export const createMessage = async (body, me_id) => {
    console.log(body)
    const conversation = await Conversation.findById(body.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const message = await Message.create({
        ...body,
        conversationId: new mongoose.Types.ObjectId(body.conversationId)
    });


    conversation.lastMessage = message._id;
    await conversation.save();

    const [populatedMessage, populatedConversation] = await Promise.all(
        [message.populate("sender", "_id fullName phoneNumber avatar"),
        Conversation.findById(body.conversationId)
            .populate("participants", "_id fullName avatar")
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
            const isMe = participant._id.toString() === me_id.toString();
            const sender = populatedConversation?.lastMessage?.sender;

            appSocket.emitToUser(participant._id.toString(), "update-chat-list", {
                ...populatedConversation,
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


export const getMessagesByConversation = async (conversationId) => {
    return await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .populate("sender", "_id fullName avatar");
};
