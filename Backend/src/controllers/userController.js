const User = require('../models/User');

exports.updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { showLastSeen, showOnlineStatus, showTypingIndicator } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.privacy = {
      ...user.privacy,
      ...(showLastSeen !== undefined && { showLastSeen }),
      ...(showOnlineStatus !== undefined && { showOnlineStatus }),
      ...(showTypingIndicator !== undefined && { showTypingIndicator })
    };

    await user.save();

    res.status(200).json({
      message: "Privacy settings updated",
      privacy: user.privacy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(keyword)
      .find({ _id: { $ne: req.session.userId } })
      .select('-password');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, bio } = req.body;

    let updateData = {};
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;

    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: '-password'
    });

    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.session.userId;

    await Chat.updateMany(
      { type: 'group', participants: userId },
      { $pull: { participants: userId, groupAdmins: userId } }
    );

    await User.findByIdAndDelete(userId);

    req.session.destroy(err => {
      if (err) return res.status(500).json({ message: "Failed to clear session" });
      res.clearCookie('connect.sid');
      res.status(200).json({ message: "Account deleted successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { userToBlockId } = req.body;

    if (userId === userToBlockId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { blockedUsers: userToBlockId } },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: "User blocked successfully", blockedUsers: updatedUser.blockedUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { userToUnblockId } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { blockedUsers: userToUnblockId } },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: "User unblocked successfully", blockedUsers: updatedUser.blockedUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId).populate('blockedUsers', 'name avatar');

    res.status(200).json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
