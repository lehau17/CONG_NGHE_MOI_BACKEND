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
    return await FriendRequest.findByIdAndDelete(new mongoose.Types.ObjectId(requestId))
};

export const getFriendRequests = async (userId, status = "pending") => {
    const optionFind = {
        to: userId,
        ...(status !== "all" && { status }) // chỉ thêm `status` nếu khác "all"
    };

    const requests = await FriendRequest.find(optionFind)
        .populate("from", "fullName avatar");

    return requests;
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
        .populate("to", "fullName avatar");   // Lấy thông tin người nhận

    // Lọc ra danh sách bạn bè từ các yêu cầu kết bạn đã chấp nhận
    const friends = requests.map(request => {
        if (request.from._id.toString() === userId.toString()) {
            return request.to;
        }
        return request.from;
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
    const result = await FriendRequest.findByIdAndDelete(id)
    if (result) {
        appSocket.emitToUser(result.from.toString(), "delete-friendship", result._id)
        appSocket.emitToUser(result.to.toString(), "delete-friendship", result._id)
    }
    return result
}
