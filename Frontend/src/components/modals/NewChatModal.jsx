import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import { useMemo, useState } from 'react';

const ContactListItem = ({ contact, selected, onSelect }) => (
  <button
    onClick={() => onSelect(contact.id)}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
      selected ? 'bg-surface-hover' : 'hover:bg-surface-hover'
    }`}
  >
    <UserAvatar name={contact.name} status={contact.status} size="sm" />
    <div className="text-left flex-1 min-w-0">
      <div className="text-sm font-medium text-foreground">{contact.name}</div>
      <div className="text-xs text-muted-foreground truncate">{contact.about}</div>
    </div>
  </button>
);

const NewChatModal = ({ isOpen, onClose, users, onSelect, onCreateGroup, title = 'New Chat', groupMode = false }) => {
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [createGroup, setCreateGroup] = useState(groupMode);

  const isGroupFlow = groupMode || createGroup;
  const requiresGroupName = !groupMode;
  const filteredUsers = useMemo(() => users.filter((user) => user.name.toLowerCase().includes(search.toLowerCase())), [search, users]);

  if (!isOpen) return null;

  const resetState = () => {
    setSearch('');
    setSelectedUsers([]);
    setGroupName('');
    setCreateGroup(groupMode);
    onClose();
  };

  const toggleUser = (userId) => {
    if (!isGroupFlow) {
      onSelect(userId);
      resetState();
      return;
    }

    setSelectedUsers((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={resetState}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-sm rounded-2xl bg-card border border-border/50 shadow-lg overflow-hidden max-h-[70vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">{isGroupFlow ? 'Create Group' : title}</h3>
            <button onClick={resetState} className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            {isGroupFlow && requiresGroupName && (
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Group name"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-1 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-1 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredUsers.map((user) => (
              <ContactListItem key={user.id} contact={user} selected={selectedUsers.includes(user.id)} onSelect={toggleUser} />
            ))}
          </div>

          <div className="p-3 border-t border-border/50 space-y-2">
            {!groupMode && (
              <button
                onClick={() => setCreateGroup((current) => !current)}
                className="w-full rounded-xl bg-surface-1 text-foreground py-2.5 text-sm font-medium border border-border/50"
              >
                {isGroupFlow ? 'Switch To Direct Chat' : 'Create Group Instead'}
              </button>
            )}

            {isGroupFlow && (
              <button
                onClick={() => {
                  onCreateGroup(groupName, selectedUsers);
                  resetState();
                }}
                disabled={(requiresGroupName && !groupName.trim()) || selectedUsers.length < (groupMode ? 1 : 2)}
                className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60"
              >
                Save
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;
