
const express = require("express");
const router = express.Router();

const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
} = require("../controllers/noteController");

const { protect } = require("../middleware/authMiddleware");

// Create a new note
router.post("/", protect, createNote);

// Get all logged-in user's notes
router.get("/", protect, getNotes);

// Get a single note
router.get("/:id", protect, getNoteById);

// Update a note
router.put("/:id", protect, updateNote);

// Delete a note
router.delete("/:id", protect, deleteNote);

module.exports = router;
