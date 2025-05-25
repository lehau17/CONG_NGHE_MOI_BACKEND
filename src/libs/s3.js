// libs/s3.js
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import { tmpdir } from "os";
import path from "path";
dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    requestHandler: new NodeHttpHandler({
        connectionTimeout: 20000, // 10s
        socketTimeout: 600000,
    }),
});

export const uploadFileToS3 = async (file, folder = "") => {
    let buffer = file.buffer;
    let key = `${folder}${Date.now()}-${file.originalname}`;
    let contentType = file.mimetype;

    // 👇 Nếu là audio, convert sang mp3
    if (file.mimetype.startsWith("audio/")) {
        const tempInput = path.join(tmpdir(), `${randomUUID()}-${file.originalname}`);
        const tempOutput = path.join(tmpdir(), `${randomUUID()}.mp3`);

        // Ghi file tạm
        await fs.writeFile(tempInput, buffer);

        // Convert sang mp3
        await new Promise((resolve, reject) => {
            ffmpeg(tempInput)
                .toFormat("mp3")
                .on("end", resolve)
                .on("error", reject)
                .save(tempOutput);
        });

        buffer = await fs.readFile(tempOutput);
        contentType = "audio/mpeg";
        key = `${folder}${Date.now()}.mp3`;

        // Xoá file tạm
        await fs.unlink(tempInput);
        await fs.unlink(tempOutput);
    }

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await s3.send(command);

    return {
        key,
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
};

export const uploadMultipleFilesToS3 = async (files, folder = "") => {
    return await Promise.all(files.map(file => uploadFileToS3(file, folder)));
};
