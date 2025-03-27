import express from "express";
import protechRoute  from '../middlewares/protechRoute.js'
import { sendMessage,getMessage } from "../controllers/message.controller.js";


const router = express.Router();
router.get("/:id",protechRoute,getMessage);
router.post("/send/:id",protechRoute,sendMessage);

export default router;