import GroupConversation from "../models/conversationGroup.model.js";
import PendingGroupInvite from "../models/pendingGroupInvite.model.js"
import FriendRequest from "../models/friendRequest.model.js";
import mongoose from "mongoose";
import { ForbiddenError, NotFoundError, BadRequestError } from "../utils/errorHandler.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js"
// Tạo nhóm mới
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

        return { message: "Thêm thành viên vào nhóm thành công (không cần duyệt)" };
    }

    // ✅ Trường hợp CÓ cần duyệt
    if (requester.role === "owner") {
        group.participants.push({ user: userId, role: "member", joinedAt: new Date() });
        await group.save();

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
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const groups = await GroupConversation.find({
        name: { $regex: keyword, $options: "i" },
        "participants.user": userObjectId
    })
        .populate("participants.user", "fullName avatar _id")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName avatar _id phoneNumber"
            }
        })
        .lean();

    return groups.map(group => {
        const sender = group.lastMessage?.sender;
        if (sender) {
            const isSelf = sender._id.toString() === userId.toString();
            sender.label = isSelf ? "Bạn" : sender.fullName?.trim().split(" ").pop() || "Người lạ";
        }

        return {
            _id: group._id, // chính là conversationId
            name: group.name,
            avatar: group.avatar,
            participants: group.participants.map(p => ({
                role: p.role,
                deletedAt: p.deletedAt,
                ...p.user
            })),
            lastMessage: group.lastMessage
        };
    });
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

    return await group.save();
};

export const getFriendsNotInGroup = async (groupId, currentUserId) => {
    // 1. Lấy tất cả friend requests đã accepted (2 chiều)
    const friends = await FriendRequest.find({
        status: "accepted",
        $or: [
            { from: currentUserId },
            { to: currentUserId }
        ]
    });

    // Lấy danh sách friendId (không phải currentUser)
    const friendIds = friends.map(f =>
        f.from.toString() === currentUserId.toString() ? f.to : f.from
    );

    // 2. Lấy danh sách participant trong group
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new Error("Không tìm thấy nhóm");

    const participantIds = group.participants.map(p => p.user.toString());

    // 3. Lọc ra bạn bè chưa ở trong nhóm
    const availableFriendIds = friendIds.filter(
        friendId => !participantIds.includes(friendId.toString())
    );

    // 4. Trả thông tin chi tiết (nếu cần)
    const availableFriends = await User.find({
        _id: { $in: availableFriendIds }
    }).select("_id username avatar"); // Tùy trường bạn muốn trả

    return availableFriends;
};

export const toggleRequireApprovalService = async (groupId, userId) => {
    const group = await GroupConversation.findById(groupId);
    if (!group) throw new NotFoundError("Không tìm thấy nhóm.");
    const isOwner = group.participants.some(
        p => p.user.toString() === userId.toString() && p.role === "owner"
    );

    if (!isOwner) throw new ForbiddenError("Chỉ nhóm trưởng mới có quyền thay đổi yêu cầu duyệt.");

    group.requireApproval = !group.requireApproval;
    await group.save();

    return {
        success: true,
        message: `Đã ${group.requireApproval ? "bật" : "tắt"} yêu cầu duyệt thành viên.`,
        requireApproval: group.requireApproval,
    };
};