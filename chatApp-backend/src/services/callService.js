const CallSession = require('../models/CallSession');

exports.initiateCall = async (callerId, receiverId, type) => {
  const call = await CallSession.create({
    caller: callerId,
    receiver: receiverId,
    type,
    status: 'ringing'
  });
  return call;
};

exports.updateCallStatus = async (callId, status) => {
  const updateData = { status };

  if (status === 'active') updateData.startedAt = Date.now();
  if (status === 'ended' || status === 'missed' || status === 'rejected') {
    updateData.endedAt = Date.now();
  }

  return await CallSession.findByIdAndUpdate(callId, updateData, { new: true });
};
