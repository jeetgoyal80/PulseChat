const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['one-to-one', 'group', 'ai'], default: 'one-to-one' },
  recentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  chatName: { type: String, trim: true },

  temporaryMode: {
    enabled: { type: Boolean, default: false },
    expiryDuration: { type: Number, default: 86400 },
    enabledAt: { type: Date }
  },

  pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
