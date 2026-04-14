import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center max-w-xs"
      >
        <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to Pulse</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select a conversation to start messaging, or create a new chat to connect with someone.
        </p>
      </motion.div>
    </div>
  );
};

export default EmptyState;
