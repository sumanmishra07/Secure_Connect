
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");

// Get all users except the logged-in user
const getChatUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id }
    }).select("name email role");

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error("Get Chat Users Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch users"
    });
  }
};

// Get conversation between logged-in user and another user
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (currentUserId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot create a conversation with yourself"
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: 1 })
      .limit(100);

    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });

  } catch (error) {
    console.error("Get Conversation Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch conversation"
    });
  }
};

module.exports = {
  getChatUsers,
  getConversation
};
