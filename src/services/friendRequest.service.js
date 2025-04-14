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
    return await FriendRequest.findByIdAndUpdate(requestId, { status: "rejected" }, { new: true });
};

export const getFriendRequests = async (userId, status = "pending") => {
    const requests = await FriendRequest.find({ to: userId, status }).populate("from", "fullName avatar");
    return requests;
};


