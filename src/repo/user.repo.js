import User from "../models/user.model.js";

class UserRepository {
    async findById(id) {
        return await User.findById(id)
    }


    async findByUsername(username) {
        return await User.findOne({userName: username})
    }
}

const userRepository = new UserRepository()
export default userRepository
