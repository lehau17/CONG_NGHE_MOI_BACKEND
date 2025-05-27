import GroupConversation from "../models/conversationGroup.model.js";
import PendingGroupInvite from "../models/pendingGroupInvite.model.js";
import Message from "../models/message.model.js";

export const findGroupById = (groupId) => GroupConversation.findById(groupId);

export const saveGroup = (group) => group.save();

export const createGroup = (data) => GroupConversation.create(data);

export const deleteGroup = (group) => group.deleteOne();

export const createInvite = (data) => PendingGroupInvite.create(data);

export const findPendingInvite = (groupId, userId) =>
    PendingGroupInvite.findOne({ groupId, invitedUser: userId, status: "pending" });

export const createMessage = (data) => Message.create(data);
