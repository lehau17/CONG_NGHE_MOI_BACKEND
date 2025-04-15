// controllers/upload.controller.js
import { uploadFileToS3, uploadMultipleFilesToS3 } from "../libs/s3.js";
import { SuccessResponse } from "../utils/response.js";

export const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadFileToS3(req.file, "uploads/");

    new SuccessResponse(result, "File uploaded successfully").response(res);
};




export const uploadMultipleFiles = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }

    const results = await uploadMultipleFilesToS3(req.files, "uploads/");
    return new SuccessResponse(results, "Files uploaded successfully").response(res);
};
