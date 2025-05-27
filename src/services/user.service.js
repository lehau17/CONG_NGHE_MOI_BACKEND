import mongoose from "mongoose";
import FriendRequest from "../models/friendRequest.model.js";
import User from "../models/user.model.js";
import userRepository from "../repo/user.repo.js";
import { BadRequestError } from "../utils/errorHandler.js";

class UserService {
    async updateUser(newUserInfo, id) {
        const userUpdated = await User.findByIdAndUpdate(id, { ...newUserInfo })
        return userUpdated
    }


    async findUserByPhone(phoneNumber, userId) {
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const foundUser = await User.findOne({
            _id: { $ne: userObjectId },
            phoneNumber,
            allow_search_by_phone: true
        }).select("-password");

        if (!foundUser) return null;

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { from: userObjectId, to: foundUser._id },
                { from: foundUser._id, to: userObjectId }
            ],
            status: { $in: ["pending", "accepted"] }
        });
        let value = {}
        if (existingRequest) {
            value.rs_id = existingRequest._id
            value.relationship = existingRequest?.status || null
            value.isSender = existingRequest?.from?.toString() === userId
        }

        return {
            ...foundUser.toObject(),
            ...existingRequest
        };
    }


    async findOneById(id) {
        const foundUser = await userRepository.findById(id)
        if (!foundUser || foundUser.status !== "active") {
            throw new BadRequestError("User khong ton tai")
        }
        return foundUser
    }
}


const userService = new UserService()
export default userService
