import express from "express";
import { login, logout, signup } from "../controllers/auth.controller.js";
import { wrapperRequestHandle } from "../utils/wrapperRequestHandler.js";

const router = express.Router();

router.post("/login",wrapperRequestHandle(login));
router.post("/logout",wrapperRequestHandle(logout));
router.post("/signup",wrapperRequestHandle(signup));
export default router;
