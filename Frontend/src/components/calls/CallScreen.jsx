import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Minimize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import UserAvatar from '@/components/common/UserAvatar';

const attachStream = (element, stream, muted = false) => {
  if (!element) return;
  if (element.srcObject !== stream) {
    element.srcObject = stream || null;
  }
  element.muted = muted;
  element.autoplay = true;
  element.playsInline = true;
  element.setAttribute('playsinline', 'true');
  if (stream) {
    const resumePlayback = () => element.play().catch(() => {});
    element.onloadedmetadata = resumePlayback;
    resumePlayback();
  } else {
    element.onloadedmetadata = null;
  }
};

const CallScreen = ({ call, onClose, onToggleMute, onToggleVideo }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    attachStream(localVideoRef.current, call?.localStream, true);
    attachStream(remoteVideoRef.current, call?.remoteStream, false);
    attachStream(remoteAudioRef.current, call?.remoteStream, false);
  }, [call?.localStream, call?.remoteStream]);

  if (!call?.open) return null;

  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/50 shadow-lg"
        onClick={() => setIsMinimized(false)}
      >
        <UserAvatar name={call.contact} size="sm" showStatus={false} />
        <div className="text-sm text-foreground font-medium">{call.contact}</div>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center overflow-hidden"
      >
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {call.type === 'video' && (
          <div className="absolute inset-0 bg-black">
            {call.remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-surface-2 to-background" />
            )}
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center">
          {call.type === 'voice' && <UserAvatar name={call.contact} size="xl" showStatus={false} />}
          <h2 className="mt-4 text-2xl font-bold text-foreground">{call.contact}</h2>
          <p className="text-sm text-primary mt-1 font-mono">
            {call.error ? 'Connection issue' : call.status === 'ringing' ? 'Ringing...' : 'Connected'}
          </p>
          {call.error && <p className="text-xs text-destructive mt-2">{call.error}</p>}
        </div>

        {call.type === 'video' && (
          <div className="absolute top-6 right-6 w-32 h-44 rounded-2xl bg-surface-3 border border-border/50 overflow-hidden z-20">
            {call.localStream ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Camera off</div>
            )}
          </div>
        )}

        <div className="relative z-10 flex items-center gap-4 mt-16">
          <button
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              call.isMuted ? 'bg-destructive/20 text-destructive' : 'bg-surface-3 text-foreground hover:bg-surface-hover'
            }`}
          >
            {call.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {call.type === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                call.isVideoOff ? 'bg-destructive/20 text-destructive' : 'bg-surface-3 text-foreground hover:bg-surface-hover'
              }`}
            >
              {call.isVideoOff ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
            </button>
          )}

          <button
            onClick={() => setIsMinimized(true)}
            className="w-14 h-14 rounded-full bg-surface-3 text-foreground hover:bg-surface-hover flex items-center justify-center transition-colors"
          >
            <Minimize2 className="w-6 h-6" />
          </button>

          <button
            onClick={onClose}
            className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 flex items-center justify-center transition-colors"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallScreen;
