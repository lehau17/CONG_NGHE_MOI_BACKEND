import * as friendService from "../services/friendRequest.service.js";
import { SuccessResponse } from "../utils/response.js";

export const sendRequest = async (req, res, next) => {
    const result = await friendService.sendFriendRequest(req.user.user_id, req.body.to);
    new SuccessResponse(result, "Đã gửi lời mời kết bạn").response(res);

};

export const getRequests = async (req, res, next) => {
    console.log("User ID:", req.user.user_id);  // Log để kiểm tra giá trị userId
    const requests = await friendService.getFriendRequests(req.user.user_id);
    new SuccessResponse(requests, "Danh sách lời mời kết bạn đang chờ").response(res);
};

export const acceptRequest = async (req, res, next) => {
    const result = await friendService.acceptFriendRequest(req.params.id);
    new SuccessResponse(result, "Đã chấp nhận lời mời kết bạn").response(res);

};

export const rejectRequest = async (req, res, next) => {
    const result = await friendService.rejectFriendRequest(req.params.id);
    new SuccessResponse(result, "Đã từ chối lời mời kết bạn").response(res);
};

export const getFriendRequest = async (req, res, next) => {
    console.log("check data", req.query.status)
    const result = await friendService.getFriendRequests(req.user.user_id, req.query.status);
    new SuccessResponse(result, "Lấy danh sách bạn bè").response(res);
}
