import { useMemo, useState } from 'react';
import { Search, Plus, Filter, LogOut, Shield, Download } from 'lucide-react';
import ChatCategoryTabs from '@/components/chat/ChatCategoryTabs';
import ChatItem from '@/components/chat/ChatItem';
import { usePwaInstall } from '@/context/PwaInstallContext';

const ChatSidebar = ({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
  activeCategory,
  onCategoryChange,
  currentUser,
  privacy,
  onPrivacyChange,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { canInstall, installApp } = usePwaInstall();

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (!searchQuery) return true;
      return (
        chat.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [chats, searchQuery]);

  const pinnedChats = filteredChats.filter((chat) => chat.isPinned);
  const regularChats = filteredChats.filter((chat) => !chat.isPinned);

  return (
    <div className="w-full h-full flex flex-col bg-card border-r border-border/50">
      <div className="p-4 space-y-3 border-b border-border/30">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Chats</h1>
            <p className="text-xs text-muted-foreground mt-1">{currentUser?.name}</p>
          </div>

          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                onClick={installApp}
                className="w-8 h-8 rounded-lg bg-surface-3 hover:bg-surface-hover flex items-center justify-center transition-colors"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={() => setShowPrivacy((current) => !current)}
              className="w-8 h-8 rounded-lg bg-surface-3 hover:bg-surface-hover flex items-center justify-center transition-colors"
            >
              <Shield className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={onNewChat}
              className="w-8 h-8 rounded-lg bg-surface-3 hover:bg-surface-hover flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={onLogout}
              className="w-8 h-8 rounded-lg bg-surface-3 hover:bg-surface-hover flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-1 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>

        <ChatCategoryTabs active={activeCategory} onChange={onCategoryChange} />

        {showPrivacy && (
          <div className="rounded-2xl bg-surface-1 border border-border/50 p-3 space-y-3">
            <div className="text-sm font-medium text-foreground">Privacy</div>
            <label className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Show last seen</span>
              <input
                type="checkbox"
                checked={privacy.showLastSeen}
                onChange={(event) => onPrivacyChange({ showLastSeen: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Show online status</span>
              <input
                type="checkbox"
                checked={privacy.showOnlineStatus}
                onChange={(event) => onPrivacyChange({ showOnlineStatus: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Show typing status</span>
              <input
                type="checkbox"
                checked={privacy.showTypingIndicator}
                onChange={(event) => onPrivacyChange({ showTypingIndicator: event.target.checked })}
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {pinnedChats.length > 0 && (
          <div className="mb-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pinned</div>
            {pinnedChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} selected={selectedChatId === chat.id} onClick={() => onSelectChat(chat.id)} />
            ))}
          </div>
        )}
        {regularChats.length > 0 && (
          <div>
            {pinnedChats.length > 0 && (
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">All Messages</div>
            )}
            {regularChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} selected={selectedChatId === chat.id} onClick={() => onSelectChat(chat.id)} />
            ))}
          </div>
        )}
        {pinnedChats.length === 0 && regularChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            <Filter className="w-8 h-8 mb-2 opacity-40" />
            No conversations found
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
