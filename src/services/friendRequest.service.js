import mongoose from "mongoose";
import FriendRequest from "../models/friendRequest.model.js";
import appSocket from "../socketIO.js";
import { BadRequestError } from "../utils/errorHandler.js";



export const sendFriendRequest = async (from, to) => {
    const exists = await FriendRequest.findOne({ from, to });
    if (exists) throw new BadRequestError("Friend request already exists");

    const request = await FriendRequest.create({ from, to });

    const populatedRequest = await request.populate("from", "fullName avatar _id");

    const socketIds = appSocket.connectedUsers.get(to.toString()) || [];
    socketIds.forEach(socketId => {
        appSocket.io.to(socketId).emit("friend-request", {
            message: "Bạn có lời mời kết bạn mới",
            from: populatedRequest.from,
            requestId: request._id
        });
    });

    return request;
};


export const acceptFriendRequest = async (requestId) => {
    const request = await FriendRequest.findByIdAndUpdate(
        requestId,
        { status: "accepted" },
        { new: true }
    ).populate("from to", "fullName avatar");

    if (!request) throw new BadRequestError("Request not found");


    // Emit event to the sender of the request
    const socketIds = appSocket.connectedUsers.get(request.from._id.toString()) || [];
    socketIds.forEach(socketId => {
        appSocket.io.to(socketId).emit("friend-request-accepted", {
            message: `${request.to.fullName} đã chấp nhận lời mời kết bạn`,
            user: request.to,
        });
    });
    return request;
};

export const rejectFriendRequest = async (requestId) => {
    const request = await FriendRequest.findById(requestId)
        .populate("from", "fullName avatar")
        .populate("to", "fullName avatar");

    if (!request) throw new BadRequestError("Request not found");

    // Xóa yêu cầu kết bạn khỏi DB
    await FriendRequest.findByIdAndDelete(requestId);

    // Gửi socket đến người gửi lời mời kết bạn (from)
    const socketIds = appSocket.connectedUsers.get(request.from._id.toString()) || [];
    socketIds.forEach(socketId => {
        appSocket.io.to(socketId).emit("friend-request-rejected", {
            message: `${request.to.fullName} đã từ chối lời mời kết bạn`,
            user: request.to,
            requestId: request._id
        });
    });

    return {
        message: "Đã từ chối lời mời kết bạn",
        requestId
    };
};



export const getFriendRequests = async (userId, status = "pending") => {
    const optionFind = {
        to: userId,
        ...(status !== "all" && { status }) // chỉ thêm status nếu khác "all"
    };

    const requests = await FriendRequest.find(optionFind)
        .populate("from", "fullName avatar")
        .populate("to", "fullName avatar");

    const friends = requests.map(request => {
        const otherUser = request.from._id.toString() === userId.toString()
            ? request.to
            : request.from;

        return {
            requestId: request._id,
            user: otherUser
        };
    });

    return friends;
};


export const getFriendsList = async (userId) => {
    // Lấy các yêu cầu kết bạn với trạng thái là 'accepted'
    const requests = await FriendRequest.find({
        $or: [
            { from: userId, status: "accepted" },
            { to: userId, status: "accepted" },
        ]
    })
        .populate("from", "fullName avatar")  // Lấy thông tin người gửi
        .populate("to", "fullName avatar")  // Lấy thông tin người nhận
        .lean()
    // Lọc ra danh sách bạn bè từ các yêu cầu kết bạn đã chấp nhận
    const friends = requests.map(request => {
        if (request.from._id.toString() === userId.toString()) {
            return { ...request.to, fs_id: request._id };
        }
        return { ...request.from, fs_id: request._id }
    });

    return friends;
};

export const getSentFriendRequests = async (from, status = "pending") => {
    const optionFind = {
        from, // lấy các lời mời mà người dùng là người gửi
        status // chỉ lấy những lời mời có trạng thái là "pending"
    };

    // Truy vấn và trả về các lời mời kết bạn đã gửi với trạng thái pending
    const requests = await FriendRequest.find(optionFind)
        .populate("to", "fullName avatar");

    return requests;
};



export const deleteFriendShip = async (id) => {
    const request = await FriendRequest.findById(id);

    

    // Xóa khỏi cơ sở dữ liệu
    await FriendRequest.findByIdAndDelete(id);

    // Gửi socket đến cả hai phía
    appSocket.emitToUser(request.from.toString(), "friend-removed", {
        friendId: request.to.toString(),
        message: "Bạn đã bị hủy kết bạn"
    });

    appSocket.emitToUser(request.to.toString(), "friend-removed", {
        friendId: request.from.toString(),
        message: "Bạn đã bị hủy kết bạn"
    });

    return {
        message: "Huỷ bạn bè thành công",
        deletedId: id
    };
};

