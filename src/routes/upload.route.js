// routes/upload.route.js
import express from "express";
import { uploadFile, uploadMultipleFiles } from "../controllers/upload.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/", upload.single("file"), uploadFile);
router.post("/multi", upload.array("files", 10), uploadMultipleFiles); // max 10 files
export default router;
