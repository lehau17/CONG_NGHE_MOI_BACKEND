import express from "express";
import * as groupController from "../controllers/conversationGroup.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";

const router = express.Router();

router.use(authenticationMiddleware.run);

router.post("/", wrapperRequestHandle(groupController.createGroup)); 
router.post("/:groupId/add-member", wrapperRequestHandle(groupController.addMember));
router.post("/:groupId/remove-member", wrapperRequestHandle(groupController.removeMember));
router.delete("/:groupId", wrapperRequestHandle(groupController.deleteGroup));
router.post("/:groupId/change-role", wrapperRequestHandle(groupController.changeMemberRole));
router.post("/:groupId/leave", wrapperRequestHandle(groupController.leaveGroup));
router.get("/:groupId/members", wrapperRequestHandle(groupController.getGroupMembersWithRoles));
router.get("/search/by-name", wrapperRequestHandle(groupController.searchGroupsByName));
router.put("/:groupId/update-info", wrapperRequestHandle(groupController.updateGroupInfo));

export default router;
