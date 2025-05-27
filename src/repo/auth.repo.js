// src/repository/auth.repository.js
import User from "../models/user.model.js";

const AuthRepository = {
    findByPhoneNumber: async (phoneNumber) => User.findOne({ phoneNumber }),

    findById: async (id) => User.findById(id),

    findByUserNameOrEmailOrPhone: async ({ userName, email, phoneNumber }) => {
        return User.find({
            $or: [{ userName }, { email }, { phoneNumber }]
        });
    },

    createUser: async (userData) => {
        const user = new User(userData);
        return user.save();
    },

    updatePasswordByPhone: async (phoneNumber, hashedPassword) => {
        return User.findOneAndUpdate(
            { phoneNumber },
            { passWord: hashedPassword },
            { new: true }
        );
    }
};

export default AuthRepository;
