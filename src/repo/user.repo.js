import User from "../models/user.model.js";

class UserRepository {
    async findById(id) {
        return User.findById(id);
    }


    async findByUsername(username) {
        return User.findOne({userName: username});
    }

}

const userRepository = new UserRepository()
export default userRepository
