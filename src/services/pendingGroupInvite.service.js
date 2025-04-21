import GroupConversation from "../models/conversationGroup.model.js";
import PendingGroupInvite from "../models/pendingGroupInvite.model.js";

import { NotFoundError, BadRequestError } from "../utils/errorHandler.js";

export const createInviteService = async ({ groupId, invitedUser, invitedBy }) => {
    const invite = await PendingGroupInvite.create({
        groupId,
        invitedUser,
        invitedBy,
        status: "pending"
    });
    return invite;
};

export const acceptInviteService = async (inviteId, currentUserId) => {
    const invite = await PendingGroupInvite.findById(inviteId);
    if (!invite) throw new NotFoundError("Không tìm thấy lời mời.");

    const group = await GroupConversation.findById(invite.groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm.");

    // Kiểm tra quyền: là người được mời hoặc là owner
    const isOwner = group.participants.some(
        p => p.user.toString() === currentUserId.toString() && p.role === "owner"
    );
    const isInvitedUser = invite.invitedUser.toString() === currentUserId.toString();

    if (!isInvitedUser && !isOwner) {
        throw new ForbiddenError("Bạn không có quyền chấp nhận lời mời này.");
    }

    // Đánh dấu trạng thái accepted
    invite.status = "accepted";

    // Nếu chưa là thành viên thì thêm vào group
    const alreadyMember = group.participants.some(
        p => p.user.toString() === invite.invitedUser.toString()
    );

    if (!alreadyMember) {
        group.participants.push({
            user: invite.invitedUser,
            role: "member",
            joinedAt: new Date()
        });
        await group.save();
    }

    // Lưu lại trạng thái mới của invite
    await invite.save();

    return { message: "Tham gia nhóm thành công." };
};


export const rejectInviteService = async (inviteId, currentUserId) => {
    const invite = await PendingGroupInvite.findById(inviteId);
    if (!invite) throw new NotFoundError("Không tìm thấy lời mời.");

    const group = await GroupConversation.findById(invite.groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm.");

    const isOwner = group.participants.some(
        p => p.user.toString() === currentUserId.toString() && p.role === "owner"
    );
    const isInvitedUser = invite.invitedUser.toString() === currentUserId.toString();

    if (!isInvitedUser && !isOwner) {
        throw new ForbiddenError("Bạn không có quyền từ chối lời mời này.");
    }

    invite.status = "rejected";
    await invite.deleteOne();

    return { message: "Đã từ chối lời mời." };
};


export const getInvitesByGroupService = async (groupId, requesterId) => {
    const group = await GroupConversation.findById(groupId);

    if (!group) throw new Error("Nhóm không tồn tại");

    const isOwner = group.participants.some(
        p => p.user.toString() === requesterId.toString() && p.role === "owner"
    );

    if (!isOwner) throw new ForbiddenError("Bạn không có quyền xem lời mời của nhóm này");

    return await PendingGroupInvite.find({ groupId })
        .populate("invitedUser", "name avatar")
        .populate("invitedBy", "name avatar");
};

