import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import GroupConversation from "../models/conversationGroup.model.js";
import { countSharedGroupConversations, getFileMessages, getMediaMessages } from "../services/conversation.service.js";
import * as groupService from "../services/conversationGroup.service.js";
import { CreatedResponse, SuccessResponse } from "../utils/response.js";


export const addMembers = async (req, res) => {
    const result = await groupService.addMembers(
        req.user.user_id,
        req.params.groupId,
        req.body.userIds // 👈 là mảng
    );

    new SuccessResponse(result, "Thêm nhiều thành viên thành công").response(res);
};

export const createGroup = async (req, res) => {
    const group = await groupService.createGroup(req.user.user_id, req.body);
    new CreatedResponse(group, "Tạo nhóm thành công").response(res);
};

export const addMember = async (req, res) => {
    const group = await groupService.addMember(req.user.user_id, req.params.groupId, req.body.userId);
    new SuccessResponse(group, "Thêm thành viên thành công").response(res);
};

export const removeMember = async (req, res) => {
    const group = await groupService.removeMember(req.user.user_id, req.params.groupId, req.body.userId);
    new SuccessResponse(group, "Xóa thành viên thành công").response(res);
};

export const deleteGroup = async (req, res) => {
    await groupService.deleteGroup(req.user.user_id, req.params.groupId);
    new SuccessResponse(null, "Giải tán nhóm thành công").response(res);
};

export const changeMemberRole = async (req, res) => {
    const group = await groupService.changeMemberRole(
        req.user.user_id,
        req.params.groupId,
        req.body.userId,
        req.body.newRole
    );
    new SuccessResponse(group, "Cập nhật quyền thành viên thành công").response(res);
};



export const leaveGroup = async (req, res) => {
    try {
        const requesterId = req.user.user_id;
        const groupId = req.params.groupId;
        await groupService.leaveGroup(requesterId, groupId);
        res.status(200).json({ message: "Đã rời khỏi nhóm thành công" });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const getGroupMembersWithRoles = async (req, res) => {
    const members = await groupService.getGroupMembersWithRoles(
        req.params.groupId,
        req.user.user_id
    );
    new SuccessResponse(members, "Lấy danh sách thành viên thành công").response(res);
};

export const searchGroupsByName = async (req, res) => {
    const groups = await groupService.searchGroupsByName(
        req.user.user_id,
        req.query.keyword || ""
    );
    new SuccessResponse(groups, "Tìm kiếm nhóm thành công").response(res);
};

export const updateGroupInfo = async (req, res) => {
    const group = await groupService.updateGroupInfo(
        req.user.user_id,
        req.params.groupId,
        req.body.name,
        req.body.avatar
    );
    new SuccessResponse(group, "Cập nhật thông tin nhóm thành công").response(res);
};

export const getFriendsNotInGroup = async (req, res) => {
    const { groupId } = req.params;
    const currentUserId = req.user.user_id;

    const friends = await groupService.getFriendsNotInGroup(groupId, currentUserId);
    new SuccessResponse(friends, "List mời vào nhóm").response(res);

};

export const toggleRequireApproval = async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user.user_id;

    const result = await groupService.toggleRequireApprovalService(groupId, userId);
    new SuccessResponse(result, "OKE").response(res);
};


export const getConversationDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type = "single" } = req.query;
        const viewerId = req.user.user_id.toString(); // 👈 Người đang xem (auth middleware)

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid conversation ID" });
        }

        let conversation = null;
        let sharedGroupCounts = [];

        if (type === "group") {
            conversation = await GroupConversation.findById(id)
                .populate("participants.user", "fullName avatar")
                .populate("lastMessage")
                .lean();

            if (!conversation) {
                return res.status(404).json({ message: "Group conversation not found" });
            }

            const participants = conversation.participants.filter(p => !p.deletedAt);

            // Tính nhóm chung giữa người đang xem và từng người khác trong group
            const counts = await Promise.all(
                participants
                    .filter(p => p.user && p.user._id.toString() !== viewerId)
                    .map(async (p) => {
                        const count = await countSharedGroupConversations(viewerId, p.user._id.toString());
                        return {
                            userId: p.user._id,
                            fullName: p.user.fullName,
                            sharedCount: count,
                        };
                    })
            );

            sharedGroupCounts = counts;

        } else {
            // SINGLE
            conversation = await Conversation.findById(id)
                .populate("participants.user", "_id fullName avatar")
                .populate("lastMessage")
                .lean();

            console.log("Check conv", conversation)
            if (!conversation) {
                return res.status(404).json({ message: "Single conversation not found" });
            }

            const [user1, user2] = conversation.participants.map(u => u.user._id.toString());
            const otherUser = user1 === viewerId ? user2 : user1;

            const sharedCount = await countSharedGroupConversations(viewerId, otherUser);
            sharedGroupCounts = [{ userId: otherUser, sharedCount }];
        }

        const mediaMessages = await getMediaMessages(id);
        const fileMessages = await getFileMessages(id);

        new SuccessResponse({
            ...conversation,
            sharedGroupCounts,
            mediaMessages,
            fileMessages,
        }, "List mời vào nhóm").response(res);

    } catch (error) {
        console.error("getConversationDetail error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
