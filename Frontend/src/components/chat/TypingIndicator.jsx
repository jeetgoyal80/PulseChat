const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-1">
      <div className="bg-chat-incoming rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;
