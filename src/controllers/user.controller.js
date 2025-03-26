import userService from "../services/user.service.js";
import { SuccessResponse } from "../utils/response.js";

class UserController {
    async update(req, res) {
        const { id } = req.params
        new SuccessResponse(await userService.updateUser(req.body, id), "Cập nhật thông tin thành công").response(res)
    }

    async myProfile(req, res) {
        const { user_id } = req.user
        new SuccessResponse(await userService.findOneById(user_id), "Lấy thông tin cá nhân thành công.").response(res)
    }

    async getProfileUserById(req, res) {
        const { id } = req.params
        new SuccessResponse(await userService.findOneById(id), "Success").response(res)
    }

    async updateMe(req, res) {
        const { id } = req.params
        new SuccessResponse(await userService.updateUser(id), "Success").response(res)
    }
}


const userController = new UserController()
export default userController
