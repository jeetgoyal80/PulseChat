const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['voice', 'video'], default: 'video' },
  status: { type: String, enum: ['ringing', 'active', 'ended', 'missed', 'rejected'], default: 'ringing' },
  startedAt: { type: Date },
  endedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('CallSession', callSessionSchema);
