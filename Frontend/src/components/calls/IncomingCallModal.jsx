import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, X } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

const IncomingCallModal = ({ call, onAccept, onDecline }) => {
  if (!call) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-80 rounded-2xl bg-card border border-border/50 shadow-lg p-5"
      >
        <div className="flex flex-col items-center">
          <UserAvatar name={call.contact} size="lg" showStatus={false} />
          <h3 className="mt-3 text-base font-semibold text-foreground">{call.contact}</h3>
          <p className="text-sm text-muted-foreground">Incoming {call.type} call...</p>
          <div className="flex items-center gap-6 mt-5">
            <button
              onClick={onDecline}
              className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-online text-primary-foreground flex items-center justify-center hover:bg-online/80 transition-colors"
            >
              {call.type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallModal;
