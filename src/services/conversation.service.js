import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import ConversationGroup from "../models/conversationGroup.model.js";
import Message from "../models/message.model.js";
import appSocket from "../socketIO.js";
export const createConversation = async (userId, targetUserId) => {
    const sortedIds = [userId, targetUserId].sort();

    const participants = sortedIds.map(id => ({
        user: new mongoose.Types.ObjectId(id),
        deletedAt: null
    }));


    let conversation = await Conversation.findOne({
        participantIds: { $all: sortedIds },
        $expr: { $eq: [{ $size: "$participantIds" }, 2] } // đúng 2 người
    });

    if (conversation) return conversation;

    return await Conversation.create({
        participants,
        participantIds: sortedIds
    });
};


export const getMyConversations = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [individualConversations, groupConversations] = await Promise.all([
        Conversation.find({ participants: { $elemMatch: { user: userObjectId } } })
            .populate("participants.user", "fullName avatar _id")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender",
                    select: "fullName avatar _id phoneNumber",
                },
            })
            .lean(),
        ConversationGroup.find({ participants: { $elemMatch: { user: userObjectId } } })
            .populate("participants.user", "fullName avatar _id")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender",
                    select: "fullName avatar _id phoneNumber",
                },
            })
            .lean(),
    ]);

    // Hàm format chung
    const formatConversations = (list, type) =>
        list.map((conv) => {
            const sender = conv.lastMessage?.sender;
            if (sender) {
                const isSelf = sender._id.toString() === userId.toString();
                sender.label = isSelf ? "Bạn" : sender.fullName?.trim().split(" ").pop() || "Người lạ";
            }

            return {
                ...conv,
                type,
                participants: conv.participants.map((pa) => ({
                    deletedAt: pa.deletedAt,
                    ...pa.user,
                    role: pa.role,
                    joinedAt: pa.joinedAt,
                })),
            };
        });

    const formattedIndividuals = formatConversations(individualConversations, "single");
    const formattedGroups = formatConversations(groupConversations, "group");

    return [...formattedIndividuals, ...formattedGroups].sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
        return bTime - aTime;
    });
};




export const getOrCreateFullConversation = async (userId, targetUserId) => {
    // Chuyển về string trước khi sort để đảm bảo thứ tự
    console.log(userId, targetUserId)
    const sortedIds = [userId.toString(), targetUserId.toString()].sort();

    let conversation = await Conversation.findOne({
        participantIds: { $all: sortedIds },
        $expr: { $eq: [{ $size: "$participantIds" }, 2] } // đúng 2 người
    });


    if (!conversation) {
        const participants = sortedIds.map((id) => ({
            user: new mongoose.Types.ObjectId(id),
            deletedAt: null
        }));

        conversation = await Conversation.create({
            participants,
            participantIds: sortedIds
        });
        appSocket.joinUserToRoom(userId, conversation._id)
        appSocket.joinUserToRoom(targetUserId, conversation._id)
        appSocket.emitToRoom(conversation._id, "newConversation", { conversationId: conversation._id, participants });
    }

    const fullConversation = await Conversation.findById(conversation._id)
        .populate("participants.user", "fullName avatar _id")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName avatar _id phoneNumber",
            }
        });

    const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 })
        .populate("sender", "fullName avatar _id");

    return { ...fullConversation.toObject(), messages };
};

