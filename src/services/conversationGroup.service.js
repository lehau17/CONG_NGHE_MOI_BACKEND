import mongoose from "mongoose";
import GroupConversation from "../models/conversationGroup.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import Message from "../models/message.model.js";
import PendingGroupInvite from "../models/pendingGroupInvite.model.js";
import User from "../models/user.model.js";
import appSocket from "../socketIO.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errorHandler.js";
// Tạo nhóm mới


export const addMembers = async (requesterId, groupId, userIds = []) => {
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new BadRequestError("Không tìm thấy nhóm");

    const requester = group.participants.find(p => p.user.toString() === requesterId);
    if (!requester) throw new ForbiddenError("Bạn không phải là thành viên của nhóm");

    const newMembers = [];
    const invitedUsers = [];
    const errors = []; // ✅ lưu lỗi chi tiết

    for (const userId of userIds) {
        const alreadyInGroup = group.participants.some(p => p.user.toString() === userId);
        const alreadyInvited = await PendingGroupInvite.findOne({
            groupId,
            invitedUser: userId,
            status: "pending"
        });

        if (alreadyInGroup) {
            errors.push({ userId, reason: "Đã là thành viên trong nhóm" });
            continue;
        }

        if (alreadyInvited) {
            errors.push({ userId, reason: "Đã được mời và đang chờ xác nhận" });
            continue;
        }

        // Nếu KHÔNG cần duyệt hoặc requester là owner → thêm luôn
        if (!group.requireApproval || requester.role === "owner") {
            group.participants.push({
                user: userId,
                role: "member",
                joinedAt: new Date()
            });

            newMembers.push(userId);
        } else {
            // Nếu cần duyệt và requester không phải owner → tạo invite
            await PendingGroupInvite.create({
                groupId,
                invitedUser: userId,
                invitedBy: requesterId,
                status: "pending"
            });

            invitedUsers.push(userId);
        }
    }

    if (newMembers.length > 0) {
        await group.save();

        group.participants.forEach(p => {
            appSocket.emitToUser(p.user.toString(), "group:member-added-group", {
                groupId,
                addedUserIds: newMembers,
                addedBy: requesterId
            });
        });
    }

    return {
        message: `Kết quả thêm thành viên vào nhóm`,
        added: newMembers,
        invited: invitedUsers,
        errors // ✅ gửi chi tiết lỗi về cho FE xử lý
    };
};





export const createGroup = async (creatorId, { name, avatar, members = [] }) => {
    // Kiểm tra tổng số thành viên phải >= 3 (bao gồm creator)
    if (members.length < 2) {
        throw new BadRequestError("Nhóm phải có ít nhất 3 thành viên bao gồm người tạo");
    }

    // Lấy avatar của creator (người tạo nhóm)
    const creator = await User.findById(creatorId);
    if (!creator || !creator.avatar) {
        throw new BadRequestError("Người tạo nhóm không có avatar.");
    }

    // Nếu avatar nhóm không được truyền vào, dùng avatar của creator
    const groupAvatarUrl = avatar || creator.avatar;

    // Tạo danh sách người tham gia
    const allParticipants = [
        { user: new mongoose.Types.ObjectId(creatorId), role: "owner" },
        ...members.map(id => ({ user: new mongoose.Types.ObjectId(id), role: "member" }))
    ];

    // Tạo nhóm
    const group = await GroupConversation.create({
        name,
        avatar: groupAvatarUrl,  // Sử dụng avatar đã xử lý
        participants: allParticipants,
        createdBy: creatorId
    });

    // Tạo nội dung tin nhắn chào mừng
    const memberNames = [creatorId, ...members].join(", ");
    const welcomeMessage = `Nhóm vừa tạo, hãy gửi lời chào đến nhau!`;

    // Tạo tin nhắn chào mừng và lưu vào cơ sở dữ liệu
    const message = await Message.create({
        conversationId: group._id,
        sender: creatorId,
        content: welcomeMessage,
        createdAt: new Date()
    });



    // Cập nhật nhóm với tin nhắn vừa tạo
    group.lastMessage = message._id;
    await group.save();
    await Promise.all([
        group.populate("participants.user", "fullName avatar phoneNumber _id"),
        message.populate("sender", "fullName avatar phoneNumber _id")])

    // Gửi sự kiện tạo nhóm đến từng thành viên
    allParticipants.forEach(p => {
        appSocket.joinUserToRoom(p.user.toString(), group._id.toString())
        appSocket.emitToUser(p.user.toString(), 'groupCreated', { group, message });
    });

    // Trả về nhóm và tin nhắn
    return { group, message };
};


// Thêm thành viên vào nhóm
export const addMember = async (requesterId, groupId, userId) => {
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm");

    const requester = group.participants.find(p => p.user.toString() === requesterId);
    if (!requester) throw new ForbiddenError("Bạn không phải là thành viên của nhóm");

    const exists = group.participants.some(p => p.user.toString() === userId);
    if (exists) throw new Error("Thành viên đã tồn tại trong nhóm");

    // ✅ Trường hợp KHÔNG cần duyệt: ai cũng có thể thêm ngay
    if (!group.requireApproval) {
        group.participants.push({ user: userId, role: "member", joinedAt: new Date() });
        await group.save();
        group.participants.forEach(p => {
            appSocket.emitToUser(p.user.toString(), 'group:member-added', {
                groupId,
                addedUserId: userId,
                addedBy: requesterId
            });
        });
        return { message: "Thêm thành viên vào nhóm thành công (không cần duyệt)" };
    }

    // ✅ Trường hợp CÓ cần duyệt
    if (requester.role === "owner") {
        group.participants.push({ user: userId, role: "member", joinedAt: new Date() });
        await group.save();
        group.participants.forEach(p => {
            appSocket.emitToUser(p.user.toString(), 'group:member-added', {
                groupId,
                addedUserId: userId,
                addedBy: requesterId
            });
        });
        return { message: "Thêm thành viên vào nhóm thành công (do owner duyệt)" };
    } else {
        await PendingGroupInvite.create({
            groupId,
            invitedUser: userId,
            invitedBy: requesterId,
            status: "pending"
        });

        return { message: "Đã tạo lời mời, chờ người dùng hoặc quản lý nhóm xác nhận" };
    }
};



// Xóa thành viên khỏi nhóm
export const removeMember = async (requesterId, groupId, userId) => {
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm");

    const requester = group.participants.find(p => p.user.toString() === requesterId);

    // Chỉ cho phép owner được xóa thành viên
    if (!requester || requester.role !== "owner") {
        throw new ForbiddenError("Chỉ chủ nhóm (owner) mới có quyền xóa thành viên");
    }

    // Nếu cố gắng tự xóa mình (owner), thì không cho phép
    if (requesterId === userId) {
        throw new ForbiddenError("Chủ nhóm không thể tự xóa chính mình khỏi nhóm");
    }
    group.participants.forEach(p => {
        appSocket.emitToUser(p.user.toString(), 'group:member-removed', {
            groupId,
            removedUserId: userId,
            removedBy: requesterId
        });
    });
    // Tiến hành xóa user khỏi danh sách thành viên
    group.participants = group.participants.filter(p => p.user.toString() !== userId);
    return await group.save();
};

// Giải tán nhóm
export const deleteGroup = async (requesterId, groupId) => {
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm");

    // Kiểm tra nếu người yêu cầu không phải là owner và nhóm còn hơn 1 thành viên
    const requester = group.participants.find(p => p.user.toString() === requesterId);
    if (!requester) {
        throw new NotFoundError("Không tìm thấy thành viên yêu cầu giải tán nhóm");
    }

    // Nếu không phải owner và nhóm còn hơn 1 thành viên, không cho phép giải tán nhóm
    if (requester.role !== "owner" && group.participants.length > 1) {
        throw new ForbiddenError("Chỉ người có quyền owner mới có thể giải tán nhóm, hoặc nhóm chỉ có một thành viên");
    }
    group.participants.forEach(p => {
        appSocket.emitToUser(p.user.toString(), 'group:deleted', { groupId });
    });
    await group.deleteOne();
};

// Phân quyền cho thành viên trong nhóm
export const changeMemberRole = async (requesterId, groupId, userId, newRole) => {
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm");

    // Kiểm tra quyền của người yêu cầu phân quyền
    const requesterIndex = group.participants.findIndex(p => p.user.toString() === requesterId);
    if (requesterIndex === -1 || group.participants[requesterIndex].role !== "owner") {
        throw new ForbiddenError("Chỉ nhóm trưởng có quyền phân quyền");
    }

    const participantIndex = group.participants.findIndex(p => p.user.toString() === userId);
    if (participantIndex === -1) {
        throw new NotFoundError("Không tìm thấy thành viên");
    }

    // Nếu chuyển quyền owner, cập nhật cả người yêu cầu
    if (newRole === "owner") {
        group.participants[requesterIndex].role = "admin";
    }

    group.participants[participantIndex].role = newRole;
    console.log(newRole)

    // Sử dụng .set() để đảm bảo Mongoose nhận diện sự thay đổi của subdocument participants
    group.set('participants', group.participants);

    // Đánh dấu mảng participants là đã bị sửa
    group.markModified('participants');
    group.participants.forEach(p => {
        appSocket.emitToUser(p.user.toString(), 'group:memberRoleChanged', {
            groupId,
            userId,
            newRole
        });
    });
    return await group.save();
};





// Rời nhóm
export const leaveGroup = async (requesterId, groupId) => {
    console.log(requesterId)
    console.log(groupId)
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm");

    // Kiểm tra nếu thành viên này có trong nhóm
    const participantIndex = group.participants.findIndex(p => p.user.toString() === requesterId);
    if (participantIndex === -1) throw new NotFoundError("Bạn không phải là thành viên của nhóm");

    // Nếu thành viên là owner, không cho phép rời nhóm
    const participant = group.participants[participantIndex];
    if (participant.role === "owner") {
        throw new ForbiddenError("Chủ nhóm không thể tự rời khỏi nhóm, hãy chuyển quyền cho người khác trước.");
    }

    // Loại bỏ thành viên khỏi nhóm
    group.participants.splice(participantIndex, 1);
    await group.save();



    appSocket.emitToRoom(group._id.toString(), 'group:memberLeft', {
        groupId,
        leftUserId: requesterId, // ID của người rời nhóm
    });

    // Gửi sự kiện thông báo có người rời nhóm cho tất cả thành viên còn lại
    group.participants.forEach(p => {
        // Sử dụng Socket.IO để gửi sự kiện đến các thành viên còn lại
        appSocket.emitToUser(p.user.toString(), 'group:memberLeft', {
            groupId,
            leftUserId: requesterId, // ID của người rời nhóm
        });
    });

    // Trả về kết quả nếu cần
    return {
        success: true,
        message: "Bạn đã rời khỏi nhóm thành công.",
    };
};

// Lấy danh sách thành viên nhóm với role
export const getGroupMembersWithRoles = async (groupId, requesterId) => {
    const group = await GroupConversation.findById(groupId)
        .populate("participants.user", "fullName avatar _id");

    if (!group) throw new NotFoundError("Không tìm thấy nhóm");

    // Kiểm tra requester có phải là thành viên không
    const isParticipant = group.participants.some(p => p.user._id.toString() === requesterId);
    if (!isParticipant) throw new ForbiddenError("Bạn không có quyền xem thành viên nhóm");

    return group.participants.map(p => ({
        _id: p.user._id,
        fullName: p.user.fullName,
        avatar: p.user.avatar,
        role: p.role,
        deletedAt: p.deletedAt || null
    }));
};


export const searchGroupsByName = async (userId, keyword) => {
    if (!keyword || !keyword.trim()) return [];

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const keywordWords = keyword.trim().split(/\s+/);
    const keywordPattern = keywordWords.map(word => `(?=.*${word})`).join("") + ".*";
    const nameRegex = new RegExp(keywordPattern, "i");

    // 1. Tìm tất cả nhóm mà user tham gia
    const groups = await GroupConversation.find({
        "participants.user": userObjectId
    })
        .populate("participants.user", "fullName avatar _id")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName avatar _id"
            }
        })
        .lean();

    // 2. Lọc nhóm theo tên nhóm hoặc tên thành viên khác mình
    const filteredGroups = groups.filter(group => {
        const groupNameMatch = nameRegex.test(group.name || "");

        const memberMatch = group.participants.some(p => {
            const isSelf = p.user._id.toString() === userId.toString();
            return !isSelf && nameRegex.test(p.user.fullName || "");
        });

        return groupNameMatch || memberMatch;
    });

    // 3. Tìm tất cả lời mời đã chấp nhận (bạn bè)
    const friendRequests = await FriendRequest.find({
        status: "accepted",
        $or: [
            { from: userObjectId },
            { to: userObjectId }
        ]
    }).lean();

    const friendIds = friendRequests.map(fr => {
        return fr.from.toString() === userId.toString() ? fr.to : fr.from;
    });

    // 4. Tìm bạn bè có tên khớp
    const matchedFriends = await User.find({
        _id: { $in: friendIds },
        fullName: nameRegex // không cần $options nếu đã dùng RegExp
    }).select("_id fullName avatar").lean();

    // 5. Kết quả bạn bè
    const friendResults = matchedFriends.map(friend => ({
        _id: friend._id,
        type: "friend",
        fullName: friend.fullName,
        avatar: friend.avatar
    }));

    // 6. Kết quả nhóm
    const groupResults = filteredGroups.map(group => {
        const sender = group.lastMessage?.sender;

        if (sender) {
            const isSelf = sender._id.toString() === userId.toString();
            sender.label = isSelf
                ? "Bạn"
                : sender.fullName?.trim().split(" ").pop() || "Người lạ";
        }

        return {
            _id: group._id,
            type: "group",
            name: group.name,
            avatar: group.avatar,
            participants: group.participants.map(p => ({
                role: p.role,
                deletedAt: p.deletedAt,
                ...p.user
            })),
            lastMessage: group.lastMessage || null
        };
    });

    // 7. Trả về kết quả gộp
    return [...groupResults, ...friendResults];
};




export const updateGroupInfo = async (requesterId, groupId, name, avatar) => {
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm");

    const requester = group.participants.find(p => p.user.toString() === requesterId);
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
        throw new ForbiddenError("Chỉ owner hoặc admin mới có quyền cập nhật nhóm");
    }

    if (name) group.name = name;
    if (avatar) group.avatar = avatar;

    // Lưu thông tin nhóm đã thay đổi
    await group.save();

    // Gửi sự kiện đến tất cả các thành viên trong nhóm để cập nhật thông tin
    group.participants.forEach(p => {
        // Gửi sự kiện cho mỗi thành viên trong nhóm
        appSocket.emitToUser(p.user.toString(), 'group:infoUpdated', {
            groupId,
            name: group.name,
            avatar: group.avatar
        });
    });

    return group;
};

export const getFriendsNotInGroup = async (groupId, currentUserId) => {
    // 1. Lấy tất cả bạn bè đã accepted (friendship 2 chiều)
    const friends = await FriendRequest.find({
        status: "accepted",
        $or: [
            { from: currentUserId },
            { to: currentUserId }
        ]
    });

    // Lấy danh sách friendId (không phải currentUser)
    const friendIds = friends.map(f =>
        f.from.toString() === currentUserId.toString() ? f.to.toString() : f.from.toString()
    );

    // 2. Lấy danh sách participant trong group
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new Error("Không tìm thấy nhóm");

    const participantIds = group.participants.map(p => p.user.toString());

    // 3. Lấy danh sách invite đang pending
    const pendingInvites = await PendingGroupInvite.find({
        groupId: groupId,
        status: "pending"
    });

    const invitedUserIds = pendingInvites.map(inv => inv.invitedUser.toString());

    // 4. Lọc bạn bè không nằm trong participants và không trong invited (pending/accepted)
    const availableFriendIds = friendIds.filter(
        friendId =>
            !participantIds.includes(friendId) &&
            !invitedUserIds.includes(friendId)
    );

    // 5. Trả thông tin chi tiết
    const availableFriends = await User.find({
        _id: { $in: availableFriendIds }
    })

    return availableFriends;
};


export const toggleRequireApprovalService = async (groupId, userId) => {
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm.");

    const isOwner = group.participants.some(
        p => p.user.toString() === userId.toString() && p.role === "owner"
    );

    if (!isOwner) throw new ForbiddenError("Chỉ nhóm trưởng mới có quyền thay đổi yêu cầu duyệt.");

    // Đảo ngược trạng thái requireApproval
    group.requireApproval = !group.requireApproval;
    await group.save();

    // Emit sự kiện tới tất cả thành viên trong nhóm
    appSocket.emitToRoom(groupId.toString(), "require-approval-toggled", {
        groupId,
        requireApproval: group.requireApproval,
        message: `Nhóm đã ${group.requireApproval ? "bật" : "tắt"} yêu cầu duyệt thành viên.`,
    });

    return {
        success: true,
        message: `Đã ${group.requireApproval ? "bật" : "tắt"} yêu cầu duyệt thành viên.`,
        requireApproval: group.requireApproval,
    };
};




export const getGroupsByUserId = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new BadRequestError("Invalid user ID");
    }

    const groups = await GroupConversation.find({
        "participants.user": new mongoose.Types.ObjectId(userId)
    })
        .populate("participants.user", "-password") // populate thông tin user, bỏ password nếu có
        .populate("createdBy", "-password")
        .populate("lastMessage"); // nếu muốn populate luôn lastMessage

    return groups;
};
