import FriendRequest from "../models/friendRequest.model.js";

export const findFriendRequest = (from, to) =>
    FriendRequest.findOne({ from, to });

export const createFriendRequest = (from, to) =>
    FriendRequest.create({ from, to });

export const findFriendRequestById = (id) =>
    FriendRequest.findById(id);

export const findFriendRequestByIdAndUpdate = (id, update, options) =>
    FriendRequest.findByIdAndUpdate(id, update, options);

export const findFriendRequestByIdAndDelete = (id) =>
    FriendRequest.findByIdAndDelete(id);

export const findFriendRequests = (filter) =>
    FriendRequest.find(filter)
        .populate("from", "_id fullName avatar")
        .populate("to", "_id fullName avatar");

export const findSentFriendRequests = (from, status) =>
    FriendRequest.find({ from, status })
        .populate("to", "fullName avatar");
