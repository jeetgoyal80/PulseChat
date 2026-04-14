const categories = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'groups', label: 'Groups' },
  { key: 'ai', label: 'AI' },
];

const ChatCategoryTabs = ({ active, onChange }) => (
  <div className="flex gap-1.5">
    {categories.map((category) => (
      <button
        key={category.key}
        onClick={() => onChange(category.key)}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          active === category.key
            ? 'bg-primary text-primary-foreground'
            : 'bg-surface-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground'
        }`}
      >
        {category.label}
      </button>
    ))}
  </div>
);

export default ChatCategoryTabs;
