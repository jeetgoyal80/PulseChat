export const messages = {
  'chat-1': [
    { id: 'm1', chatId: 'chat-1', senderId: '1', content: 'Hey! How\'s the project going?', timestamp: '10:15 AM', type: 'text', status: 'read' },
    { id: 'm2', chatId: 'chat-1', senderId: 'me', content: 'Going well! Just finishing up the components.', timestamp: '10:17 AM', type: 'text', status: 'read' },
    { id: 'm3', chatId: 'chat-1', senderId: '1', content: 'That\'s great! I have some design updates to share.', timestamp: '10:20 AM', type: 'text', status: 'read' },
    { id: 'm4', chatId: 'chat-1', senderId: 'me', content: 'Sure, send them over!', timestamp: '10:22 AM', type: 'text', status: 'read' },
    { id: 'm5', chatId: 'chat-1', senderId: '1', content: '', timestamp: '10:30 AM', type: 'image', status: 'read', imageUrl: '/placeholder.svg' },
    { id: 'm6', chatId: 'chat-1', senderId: '1', content: 'Check out the new design mockups I just uploaded! 🎨', timestamp: '10:32 AM', type: 'text', status: 'delivered' },
    { id: 'm7', chatId: 'chat-1', senderId: 'me', content: 'These look incredible! Love the color palette.', timestamp: '10:35 AM', type: 'text', status: 'read' },
    { id: 'm8', chatId: 'chat-1', senderId: '1', content: 'design-system-v2.fig', timestamp: '10:38 AM', type: 'file', status: 'read', fileName: 'design-system-v2.fig', fileSize: '4.2 MB' },
    { id: 'm9', chatId: 'chat-1', senderId: 'me', content: '', timestamp: '10:40 AM', type: 'voice', status: 'sent', duration: '0:42' },
    { id: 'm10', chatId: 'chat-1', senderId: '1', content: 'Check out the new design mockups I just uploaded! 🎨', timestamp: '10:45 AM', type: 'text', status: 'delivered' },
  ],
  'chat-ai': [
    { id: 'ai1', chatId: 'chat-ai', senderId: 'ai', content: '👋 Hi! I\'m your personal AI assistant. I can help you with summarizing chats, drafting replies, planning your day, translating messages, and much more. What would you like to do?', timestamp: '9:00 AM', type: 'ai-response' },
    { id: 'ai2', chatId: 'chat-ai', senderId: 'me', content: 'Can you help me draft a reply to Sarah about the design mockups?', timestamp: '9:05 AM', type: 'text', status: 'read' },
    { id: 'ai3', chatId: 'chat-ai', senderId: 'ai', content: 'Sure! Here\'s a draft reply:\n\n"Hey Sarah! The mockups look fantastic — really love the direction you\'ve taken with the new color system. A few thoughts:\n\n1. The card components feel very polished\n2. The spacing system is clean and consistent\n3. Maybe we could explore a slightly warmer accent color?\n\nLet\'s sync up tomorrow to discuss details!"\n\nWould you like me to adjust the tone or content?', timestamp: '9:05 AM', type: 'ai-response' },
  ],
  'chat-2': [
    { id: 'mc1', chatId: 'chat-2', senderId: '2', content: 'Hey, I just pushed the last commit for the API integration.', timestamp: '9:30 AM', type: 'text', status: 'read' },
    { id: 'mc2', chatId: 'chat-2', senderId: 'me', content: 'Awesome! Did you add the error handling middleware?', timestamp: '9:32 AM', type: 'text', status: 'read' },
    { id: 'mc3', chatId: 'chat-2', senderId: '2', content: 'Yes, full error handling with retry logic and rate limiting.', timestamp: '9:35 AM', type: 'text', status: 'read' },
    { id: 'mc4', chatId: 'chat-2', senderId: '2', content: 'The API integration is done. Ready for review.', timestamp: '9:40 AM', type: 'text', status: 'read' },
  ],
  'chat-3': [
    { id: 'sys1', chatId: 'chat-3', senderId: 'system', content: '🔒 Temporary chat enabled for 3 days', timestamp: '8:00 AM', type: 'system' },
    { id: 'sys2', chatId: 'chat-3', senderId: 'system', content: 'Messages in this conversation will disappear after expiry', timestamp: '8:00 AM', type: 'system' },
    { id: 'me1', chatId: 'chat-3', senderId: 'me', content: 'Hi Elena! Do you have time for a user testing session this week?', timestamp: '8:15 AM', type: 'text', status: 'read' },
    { id: 'me2', chatId: 'chat-3', senderId: '3', content: 'Can we schedule a user testing session this week?', timestamp: '8:20 AM', type: 'text', status: 'delivered' },
  ],
};
