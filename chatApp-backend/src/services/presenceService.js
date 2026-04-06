const User = require('../models/User');

exports.setUserOnline = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { isOnline: true },
    { new: true, select: 'privacy friends' }
  );
};

exports.setUserOffline = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { isOnline: false, lastSeen: Date.now() },
    { new: true, select: 'privacy friends' }
  );
};

exports.getUserPrivacy = async (userId) => {
  const user = await User.findById(userId).select('privacy');
  return user?.privacy;
};
