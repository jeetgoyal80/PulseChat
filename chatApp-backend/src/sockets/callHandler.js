const callService = require('../services/callService');
const User = require('../models/User');

module.exports = (io, socket) => {

  const userId = socket.request.session?.userId;

  socket.on('call_user', async ({ userToCall, signalData, from, name, type }) => {
    try {

    const receiver = await User.findById(userToCall).select('blockedUsers');
    if (receiver.blockedUsers.includes(userId)) {

       return socket.emit('call_error', { message: "Call could not be completed." });
    }

      const callRecord = await callService.initiateCall(userId, userToCall, type);

      io.to(userToCall).emit('incoming_call', {
        callId: callRecord._id,
        signal: signalData,
        from,
        name,
        type
      });
    } catch (error) {
      console.error("Call initiation failed:", error);
      socket.emit('call_error', { message: "Failed to initiate call" });
    }
  });

  socket.on('answer_call', async (data) => {
    try {

      await callService.updateCallStatus(data.callId, 'active');

      io.to(data.to).emit('call_accepted', data.signal);
    } catch (error) {
      console.error("Call answer failed:", error);
    }
  });

  socket.on('end_call', async ({ to, callId, reason }) => {
    try {

      await callService.updateCallStatus(callId, reason || 'ended');

      io.to(to).emit('call_ended');
    } catch (error) {
       console.error("Call end failed:", error);
    }
  });
};
