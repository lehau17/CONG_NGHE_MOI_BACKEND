import User from "../models/user.model.js";
import userRepository from "../repo/user.repo.js";
import { BadRequestError } from "../utils/errorHandler.js";

class UserService {
    async updateUser(newUserInfo, id) {
        const userUpdated = await User.findByIdAndUpdate(id, { ...newUserInfo })
        return userUpdated
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
