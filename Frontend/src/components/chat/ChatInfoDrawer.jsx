import { motion } from 'framer-motion';
import { X, Clock, Shield, Users, UserPlus, UserMinus } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

const ChatInfoDrawer = ({
  chat,
  currentUser,
  blocked,
  onClose,
  onEnableTemporary,
  onToggleBlock,
  onAddMembers,
  onRemoveMember,
}) => {
  if (!chat) return null;

  const isAdmin = chat.groupAdmins?.some((admin) => String(admin._id) === String(currentUser?.id));

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="w-full md:w-80 h-full bg-card border-l border-border/50 flex flex-col overflow-y-auto"
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h2 className="text-sm font-semibold text-foreground">Chat Info</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-col items-center py-6">
        <UserAvatar name={chat.contact.name} status={chat.contact.status} size="xl" isAI={chat.isAI} />
        <h3 className="mt-3 text-lg font-semibold text-foreground">{chat.contact.name}</h3>
        <p className="text-sm text-muted-foreground">{chat.contact.about || 'No status'}</p>
      </div>

      <div className="px-4 space-y-2">
        <button
          onClick={onEnableTemporary}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors"
        >
          <Clock className="w-4 h-4 text-temporary" />
          <span className="text-sm text-foreground">Temporary Chat</span>
          {chat.temporaryChat?.enabled && (
            <span className="ml-auto text-[11px] text-temporary font-medium">{chat.temporaryChat.duration}s</span>
          )}
        </button>

        {!chat.isAI && !chat.isGroup && (
          <button
            onClick={onToggleBlock}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors"
          >
            <Shield className={`w-4 h-4 ${blocked ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={`text-sm ${blocked ? 'text-destructive' : 'text-foreground'}`}>{blocked ? 'Unblock User' : 'Block User'}</span>
          </button>
        )}

        {chat.isGroup && isAdmin && (
          <button
            onClick={onAddMembers}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors"
          >
            <UserPlus className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Add Members</span>
          </button>
        )}
      </div>

      {chat.isGroup && (
        <div className="px-4 mt-4">
          <div className="h-px bg-border/50 mb-3" />
          <div className="flex items-center gap-2 px-3 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Members ({chat.groupMembers.length})</span>
          </div>
          {chat.groupMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-3 py-2">
              <UserAvatar name={member.name} status={member.status} size="sm" />
              <span className="text-sm text-foreground flex-1">{member.name}</span>
              {isAdmin && String(member.id) !== String(currentUser?.id) && (
                <button onClick={() => onRemoveMember(member.id)} className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center">
                  <UserMinus className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ChatInfoDrawer;
