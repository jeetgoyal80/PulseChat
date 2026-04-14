import { motion } from 'framer-motion';
import UserAvatar from '@/components/common/UserAvatar';

const ChatItem = ({ chat, selected, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.98 }}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left mb-0.5 ${
      selected ? 'bg-surface-hover' : 'hover:bg-surface-1'
    }`}
  >
    <UserAvatar name={chat.contact.name} status={chat.contact.status} isAI={chat.isAI} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{chat.contact.name}</span>
          {chat.isAI && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-primary/20 text-primary">AI</span>
          )}
          {chat.temporaryChat?.enabled && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-temporary/20 text-temporary">TTL</span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground flex-shrink-0">{chat.lastMessageTime}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground truncate pr-2">
          {chat.typing ? (
            <span className="text-primary italic">typing...</span>
          ) : (
            chat.lastMessage
          )}
        </p>
        {chat.unreadCount > 0 && (
          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
            {chat.unreadCount}
          </span>
        )}
      </div>
    </div>
  </motion.button>
);

export default ChatItem;
