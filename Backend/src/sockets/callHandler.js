const callService = require('../services/callService');
const User = require('../models/User');

module.exports = (io, socket, { emitToUser } = {}) => {
  const userId = socket.request.session?.userId;
  const sendToUser = (targetUserId, event, payload) => {
    const delivered = emitToUser?.(targetUserId, event, payload);
    if (!delivered) {
      io.to(targetUserId.toString()).emit(event, payload);
    }
  };

  socket.on('call_user', async ({ userToCall, signalData, from, name, type }) => {
    try {
      const receiver = await User.findById(userToCall).select('blockedUsers');
      if (receiver?.blockedUsers?.includes(userId)) {
        return socket.emit('call_error', { message: 'Call could not be completed.' });
      }

      const callRecord = await callService.initiateCall(userId, userToCall, type);

      sendToUser(userToCall, 'incoming_call', {
        callId: callRecord._id,
        signal: signalData,
        from,
        name,
        type
      });
    } catch (error) {
      console.error('Call initiation failed:', error);
      socket.emit('call_error', { message: 'Failed to initiate call' });
    }
  });

  const acceptCall = async (data) => {
    try {
      await callService.updateCallStatus(data.callId, 'active');
      sendToUser(data.to, 'call_accepted', {
        callId: data.callId,
        signal: data.signal,
        by: userId
      });
    } catch (error) {
      console.error('Call answer failed:', error);
    }
  };

  socket.on('answer_call', acceptCall);
  socket.on('accept_call', acceptCall);

  socket.on('ice_candidate', ({ to, callId, candidate }) => {
    sendToUser(to, 'ice_candidate', {
      callId,
      candidate,
      from: userId
    });
  });

  socket.on('reject_call', async ({ to, callId }) => {
    try {
      await callService.updateCallStatus(callId, 'rejected');
      sendToUser(to, 'call_rejected', { callId, by: userId });
    } catch (error) {
      console.error('Call reject failed:', error);
    }
  });

  socket.on('end_call', async ({ to, callId, reason }) => {
    try {
      await callService.updateCallStatus(callId, reason || 'ended');
      sendToUser(to, 'call_ended', { callId, by: userId, reason: reason || 'ended' });
    } catch (error) {
      console.error('Call end failed:', error);
    }
  });
};
