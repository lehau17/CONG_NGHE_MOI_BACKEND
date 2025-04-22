import GroupConversation from "../models/conversationGroup.model.js";
import PendingGroupInvite from "../models/pendingGroupInvite.model.js";

import { NotFoundError, BadRequestError } from "../utils/errorHandler.js";
import appSocket from "../socketIO.js"

export const createInviteService = async ({ groupId, invitedUser, invitedBy }) => {
    const invite = await PendingGroupInvite.create({
        groupId,
        invitedUser,
        invitedBy,
        status: "pending"
    });

    // Emit về room của group để owner có thể update ngay lập tức
    appSocket.emitToRoom(groupId.toString(), "new-group-invite", {
        groupId,
        invitedUser,
        invitedBy,
        inviteId: invite._id,
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
    let newlyJoined = false;

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
        newlyJoined = true;
    }

    await invite.save();

    if (newlyJoined) {
        appSocket.emitToRoom(group._id.toString(), "user-joined-group", {
            groupId: group._id,
            user: invite.invitedUser,
        });
    }

    return {
        message: "Tham gia nhóm thành công.",
        groupId: group._id,
        userId: invite.invitedUser,
        newlyJoined,
    };
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

