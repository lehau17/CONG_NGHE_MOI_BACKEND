import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import dotenv from 'dotenv';
dotenv.config()
export const generateToken = (channelName, uid) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithUid(
        appId, appCertificate, channelName, uid, RtcRole.PUBLISHER, privilegeExpireTs
    );
};
