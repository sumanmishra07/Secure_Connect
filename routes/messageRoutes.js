
const express = require("express");
const router = express.Router();

const {
  getChatUsers,
  getConversation
} = require("../controllers/messageController");

const { protect } = require("../middleware/authMiddleware");

// Get all registered users except logged-in user
router.get("/users", protect, getChatUsers);

// Get conversation with a particular user
router.get("/:userId", protect, getConversation);

module.exports = router;
