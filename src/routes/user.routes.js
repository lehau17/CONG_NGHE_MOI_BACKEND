import express from "express"
import userController from "../controllers/user.controller.js"
import authenticationMiddleware from "../middlewares/authentication.middleware.js"
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js"


const userRouter = express.Router()

userRouter.patch("/me", authenticationMiddleware.run, wrapperRequestHandle(userController.updateMe))
userRouter.patch("/:id", authenticationMiddleware.run, wrapperRequestHandle(userController.update))
userRouter.get("/me", authenticationMiddleware.run, wrapperRequestHandle(userController.myProfile))
userRouter.get("/:id", wrapperRequestHandle(userController.getProfileUserById))

export default userRouter
