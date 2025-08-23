// tokenWorker.js
import { parentPort } from "worker_threads";
import twilio from "twilio";

parentPort.on(
  "message",
  ({
    identity,
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    TWILIO_TWIML_APP_SID,
  }) => {
    try {
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      const token = new AccessToken(
        TWILIO_ACCOUNT_SID,
        TWILIO_API_KEY,
        TWILIO_API_SECRET,
        { identity }
      );
      const grant = new VoiceGrant({
        outgoingApplicationSid: TWILIO_TWIML_APP_SID,
        incomingAllow: true,
      });
      token.addGrant(grant);

      const jwt = token.toJwt();
      parentPort.postMessage(jwt);
    } catch (error) {
      console.error("Worker failed to generate token:", error);
      parentPort.postMessage(null);
    }
  }
);
