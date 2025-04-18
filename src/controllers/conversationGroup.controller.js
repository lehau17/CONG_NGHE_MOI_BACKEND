import * as groupService from "../services/conversationGroup.service.js";
import { SuccessResponse, CreatedResponse } from "../utils/response.js";

export const createGroup = async (req, res) => {
    const group = await groupService.createGroup(req.user.user_id, req.body);
    new CreatedResponse(group, "Tạo nhóm thành công").response(res);
};

export const addMember = async (req, res) => {
    const group = await groupService.addMember(req.user.user_id, req.params.groupId, req.body.userId);
    new SuccessResponse(group, "Thêm thành viên thành công").response(res);
};

export const removeMember = async (req, res) => {
    const group = await groupService.removeMember(req.user.user_id, req.params.groupId, req.body.userId);
    new SuccessResponse(group, "Xóa thành viên thành công").response(res);
};

export const deleteGroup = async (req, res) => {
    await groupService.deleteGroup(req.user.user_id, req.params.groupId);
    new SuccessResponse(null, "Giải tán nhóm thành công").response(res);
};

export const changeMemberRole = async (req, res) => {
    const group = await groupService.changeMemberRole(
        req.user.user_id,
        req.params.groupId,
        req.body.userId,
        req.body.newRole
    );
    new SuccessResponse(group, "Cập nhật quyền thành viên thành công").response(res);
};



export const leaveGroup = async (req, res) => {
    try {
        const requesterId = req.user.user_id;
        const groupId = req.params.groupId;
        await groupService.leaveGroup(requesterId, groupId);
        res.status(200).json({ message: "Đã rời khỏi nhóm thành công" });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const getGroupMembersWithRoles = async (req, res) => {
    const members = await groupService.getGroupMembersWithRoles(
        req.params.groupId,
        req.user.user_id
    );
    new SuccessResponse(members, "Lấy danh sách thành viên thành công").response(res);
};

export const searchGroupsByName = async (req, res) => {
    const groups = await groupService.searchGroupsByName(
        req.user.user_id,
        req.query.keyword || ""
    );
    new SuccessResponse(groups, "Tìm kiếm nhóm thành công").response(res);
};
