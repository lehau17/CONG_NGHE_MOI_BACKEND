import mongoose from "mongoose";
import Conversation from "../../models/conversation.model.js";
import GroupConversation from "../../models/conversationGroup.model.js";
import Message from "../../models/message.model.js";

export const findSingleConversation = (sortedIds) =>
    Conversation.findOne({
        participantIds: { $all: sortedIds },
        $expr: { $eq: [{ $size: "$participantIds" }, 2] },
    });

export const createSingleConversation = (participants, sortedIds) =>
    Conversation.create({ participants, participantIds: sortedIds });

export const getSingleConversationsByUser = (userObjectId) =>
    Conversation.find({ participants: { $elemMatch: { user: userObjectId } } })
        .populate("participants.user", "fullName avatar _id")
        .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "fullName avatar _id phoneNumber" },
        })
        .lean();

export const getGroupConversationsByUser = (userObjectId) =>
    GroupConversation.find({ participants: { $elemMatch: { user: userObjectId } } })
        .populate("participants.user", "fullName avatar _id")
        .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "fullName avatar _id phoneNumber" },
        })
        .lean();

export const findConversationById = (id) =>
    Conversation.findById(id)
        .populate("participants.user", "fullName avatar _id")
        .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "fullName avatar _id phoneNumber" },
        });

export const getMessagesByConversationId = (conversationId) =>
    Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .populate("sender", "fullName avatar _id");

export const countSharedGroups = (userId1, userId2) =>
    GroupConversation.countDocuments({
        type: "group",
        participants: {
            $all: [
                { $elemMatch: { user: userId1, deletedAt: null } },
                { $elemMatch: { user: userId2, deletedAt: null } },
            ],
        },
    });

export const getMediaMessages = (conversationId) =>
    Message.find({
        conversationId,
        type: { $in: ["image", "video"] },
        isRevoke: false,
    })
        .sort({ createdAt: -1 })
        .select("type content fileMeta sender createdAt");

export const getFileMessages = (conversationId) =>
    Message.find({
        conversationId,
        type: "file",
        isRevoke: false,
    })
        .sort({ createdAt: -1 })
        .select("type content fileMeta sender createdAt");
