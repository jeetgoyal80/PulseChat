const axios = require('axios');
const Message = require('../models/Message');

const AI_USER_ID = '000000000000000000000000';

exports.generateAIResponse = async (prompt, contextChatId) => {
  try {
    let messagesPayload = [
      {
        role: "system",
        content: "You are my.ai, a helpful, intelligent assistant built directly into a messaging app. You can read the chat history to provide context-aware summaries and answers. Keep responses concise and natural like a chat message."
      }
    ];

    if (contextChatId) {
      const pastMessages = await Message.find({ chatId: contextChatId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('sender', 'name');

      const formattedHistory = pastMessages.reverse().map(msg => {
        const senderName = msg.sender?._id?.toString() === AI_USER_ID ? "my.ai" : (msg.sender?.name || 'User');
        return `${senderName}: ${msg.content}`;
      }).join('\n');

      messagesPayload.push({
        role: "user",
        content: `Here is the recent chat history for context:\n${formattedHistory}`
      });
    }

    messagesPayload.push({
      role: "user",
      content: prompt || "Summarize the chat above."
    });

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama-3.1-8b-instant",
        messages: messagesPayload,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("Groq AI Generation Error:", error.response?.data || error.message);
    return "Sorry, my processors are a bit overwhelmed right now.";
  }
};
