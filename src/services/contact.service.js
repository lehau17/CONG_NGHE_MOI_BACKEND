import mongoose from "mongoose";
import FriendRequest from "../models/friendRequest.model.js";

// services/friend-request.service.js
export const getGroupedContacts = async (userId, sortDirection = "desc") => {
    const sortOrder = sortDirection === "asc" ? -1 : 1;

    const groupedContacts = await FriendRequest.aggregate([
        {
            $match: {
                status: "accepted",
                $or: [
                    { from: new mongoose.Types.ObjectId(userId) },
                    { to: new mongoose.Types.ObjectId(userId) }
                ]
            }
        },
        {
            $addFields: {
                friend: {
                    $cond: [
                        { $eq: ["$from", new mongoose.Types.ObjectId(userId)] },
                        "$to",
                        "$from"
                    ]
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "friend",
                foreignField: "_id",
                as: "friendInfo"
            }
        },
        { $unwind: "$friendInfo" },
        {
            $addFields: {
                firstLetter: {
                    $toUpper: { $substrCP: ["$friendInfo.fullName", 0, 1] }
                }
            }
        },
        {
            $group: {
                _id: "$firstLetter",
                users: {
                    $push: {
                        _id: "$friendInfo._id",
                        fullName: "$friendInfo.fullName",
                        avatar: "$friendInfo.avatar"
                    }
                }
            }
        },
        {
            $sort: {
                _id: sortOrder // A-Z hoặc Z-A
            }
        },
        {
            $project: {
                letter: "$_id",
                users: {
                    $sortArray: {
                        input: "$users",
                        sortBy: { fullName: 1 }
                    }
                },
                _id: 0
            }
        }
    ]);

    return groupedContacts;
};
