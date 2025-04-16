// libs/s3.js
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import dotenv from "dotenv";
dotenv.config();
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    requestHandler: new NodeHttpHandler({
        connectionTimeout: 20000, // 10s
        socketTimeout: 60000,     // 60s
    }),
});

export const uploadFileToS3 = async (file, folder = "") => {
    const key = `${folder}${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3.send(command);
    console.log("chjeck >>>")

    return {
        key,
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
};


export const uploadMultipleFilesToS3 = async (files, folder = "") => {
    return await Promise.all(files.map(file => uploadFileToS3(file, folder)));
};
