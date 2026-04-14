const optionalTurnServer = import.meta.env.VITE_TURN_SERVER_URL;
const optionalTurnUsername = import.meta.env.VITE_TURN_SERVER_USERNAME;
const optionalTurnCredential = import.meta.env.VITE_TURN_SERVER_CREDENTIAL;

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

if (optionalTurnServer && optionalTurnUsername && optionalTurnCredential) {
  iceServers.push({
    urls: optionalTurnServer,
    username: optionalTurnUsername,
    credential: optionalTurnCredential,
  });
}

export const rtcConfig = {
  iceServers,
  iceCandidatePoolSize: 10,
};

export const stopMediaStream = (stream) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
};
