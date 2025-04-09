// controllers/upload.controller.js
import { uploadFileToS3 } from "../libs/s3.js";
import { SuccessResponse } from "../utils/response.js";

export const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadFileToS3(req.file, "uploads/");

    new SuccessResponse(result, "File uploaded successfully").response(res);
};
