import {
    createInviteService,
    acceptInviteService,
    rejectInviteService,
    getInvitesByGroupService
} from "../services/pendingGroupInvite.service.js";

export const createInvite = async (req, res, next) => {
    try {
        const result = await createInviteService(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

export const acceptInvite = async (req, res, next) => {
    try {
        const currentUserId = req.user.user_id; // 👈 lấy user id từ middleware xác thực
        const result = await acceptInviteService(req.params.inviteId, currentUserId);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const rejectInvite = async (req, res, next) => {
    try {
        const currentUserId = req.user.user_id; // 👈 lấy user id từ middleware xác thực
        const result = await rejectInviteService(req.params.inviteId, currentUserId);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const getInvitesByGroup = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const requesterId = req.user.user_id; // cần middleware auth gán user vào req

        const invites = await getInvitesByGroupService(groupId, requesterId);
        res.status(200).json(invites);
    } catch (err) {
        next(err);
    }
};

