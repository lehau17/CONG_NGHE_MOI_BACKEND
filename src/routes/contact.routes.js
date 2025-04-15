import express from "express"
import { getContact } from "../controllers/contact.controller.js"
import authenticationMiddleware from "../middlewares/authentication.middleware.js"
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js"

const contactRouter = express.Router()


contactRouter.get("/", authenticationMiddleware.run, wrapperRequestHandle(getContact))

export default contactRouter
