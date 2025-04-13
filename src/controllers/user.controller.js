import userService from "../services/user.service.js";
import { BadRequestError } from "../utils/errorHandler.js";
import { SuccessResponse } from "../utils/response.js";

class UserController {
    async update(req, res, next) {
        const { id } = req.params;
        const updatedUser = await userService.updateUser(req.body, id);
        new SuccessResponse(updatedUser, "Cập nhật thông tin thành công").response(res);
    }

    async myProfile(req, res, next) {
        const { user_id } = req.user;
        const user = await userService.findOneById(user_id);

        // Chỉ trả về những trường cần thiết
        const {
            fullName, userName, gender, dob,
            phoneNumber, email, avatar, background,
            is_twofa_enabled, twofa_method,
            is_visible_dob, allow_message,
            allow_search_by_phone, enable_fast_message,
            list_fast_message, createdAt, updatedAt
        } = user;

        const userProfile = {
            _id: user._id,
            fullName,
            userName,
            gender,
            dob,
            phoneNumber,
            email,
            avatar,
            background,
            is_twofa_enabled,
            twofa_method,
            is_visible_dob,
            allow_message,
            allow_search_by_phone,
            enable_fast_message,
            list_fast_message,
            createdAt,
            updatedAt
        };

        new SuccessResponse(userProfile, "Lấy thông tin cá nhân thành công").response(res);
    }

    async getProfileUserById(req, res, next) {
        const { id } = req.params;
        const user = await userService.findOneById(id);
        new SuccessResponse(user, "Lấy thông tin người dùng thành công").response(res);
    }


    async searhUser(req, res, next) {
        const { phone } = req.query;

        if (!phone) {
            throw new BadRequestError("Thiếu số điện thoại")
        }

        const user = await userService.findUserByPhone(phone);

        return new SuccessResponse(user, "Tìm thấy người dùng").response(res);
    }

    async updateMe(req, res, next) {
        const { user_id } = req.user;
        const updatedUser = await userService.updateUser(req.body, user_id);
        new SuccessResponse(updatedUser, "Cập nhật thông tin thành công").response(res);
    }
}

const userController = new UserController();
export default userController;
