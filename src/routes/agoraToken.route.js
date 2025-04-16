import pkg from 'agora-access-token';
import dotenv from 'dotenv';
import express from 'express';
const { RtcRole, RtcTokenBuilder } = pkg;

dotenv.config();

const agoraRouter = express.Router();

agoraRouter.get('/token', (req, res) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;
    const channelName = req.query.channel;
    const uid = req.query.uid;

    if (!channelName || !uid) {
        return res.status(400).json({ error: "Missing channel or uid" });
    }

    const role = RtcRole.PUBLISHER;
    const expireTimeInSeconds = 3600; // 1 giờ
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expireTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        parseInt(uid),
        role,
        privilegeExpireTs
    );

    return res.json({ token });
});

export default agoraRouter;
