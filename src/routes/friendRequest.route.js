import express from "express";
import * as controller from "../controllers/friendRequest.controller.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";

const router = express.Router();

router.get("/", authenticationMiddleware.run, wrapperRequestHandle(controller.getFriendRequest));
router.post("/send", authenticationMiddleware.run, wrapperRequestHandle(controller.sendRequest));
router.get("/pending", authenticationMiddleware.run, wrapperRequestHandle(controller.getRequests));
router.put("/accept/:id", authenticationMiddleware.run, wrapperRequestHandle(controller.acceptRequest));
router.put("/reject/:id", authenticationMiddleware.run, wrapperRequestHandle(controller.rejectRequest));
router.get("/friends", authenticationMiddleware.run, wrapperRequestHandle(controller.getFriends));
router.get("/sent", authenticationMiddleware.run, wrapperRequestHandle(controller.getSentFriendRequests));
router.delete("/:id", authenticationMiddleware.run, wrapperRequestHandle(controller.deleteFriendShip));

export default router;
