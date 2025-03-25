import express from "express"
import userController from "../controllers/user.controller.js"
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js"


const userRouter = express.Router()

userRouter.patch("/:id", wrapperRequestHandle(userController.update))
userRouter.get("/:id", wrapperRequestHandle(userController.getProfileUserById))
userRouter.get("/my-profile", wrapperRequestHandle(userController.myProfile))

export default userRouter
