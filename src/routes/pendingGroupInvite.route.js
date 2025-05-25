import express from "express";
import {
    acceptInvite,
    createInvite,
    getInvitesByGroup,
    rejectInvite
} from "../controllers/pendingGroupInvite.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";
const router = express.Router();

router.use(authenticationMiddleware.run);


router.post("/", wrapperRequestHandle(createInvite));           // Tạo lời mời mới
router.post("/:inviteId/accept", wrapperRequestHandle(acceptInvite));   // Chấp nhận lời mời
router.post("/:inviteId/reject", wrapperRequestHandle(rejectInvite));   // Từ chối lời mời
router.get("/:groupId", wrapperRequestHandle(getInvitesByGroup));

export default router;
