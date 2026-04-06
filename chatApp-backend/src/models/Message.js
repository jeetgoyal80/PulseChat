const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
messageType: { type: String, enum: ['text', 'media', 'document', 'video', 'call_log'], default: 'text' },

  // Media fields
  mediaUrl: { type: String, default: null },
  mediaFormat: { type: String, default: null },
  fileName: { type: String, default: null },
  
  // Delivery status (For Blue Ticks)
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  
  // ⚡ NEW: For Swiping/Replying to a specific message
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  
  // Temporary Chat Logic
  isTemporary: { type: Boolean, default: false },
  expiresAt: { type: Date } 
}, { timestamps: true });

messageSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema);