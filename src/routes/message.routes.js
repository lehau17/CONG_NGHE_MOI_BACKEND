import express from "express";
import protechRoute  from '../middlewares/protechRoute.js'
import { sendMessage } from "../controllers/message.controller.js";


const router = express.Router();

router.post("/send/:id",protechRoute,sendMessage);

export default router;