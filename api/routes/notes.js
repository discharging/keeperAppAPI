const express = require("express");
const User = require("../models/user");
const router = express.Router();
const { verifyToken } = require("../middlewares/check-auth");

router.get("/", verifyToken, async (req, res) => {
  try {
    // Ensure that the user is valid (was authenticated via verifyToken middleware)
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Retrieve notes array for the user
    const notes = user.notes;

    // Respond with the user's notes
    res.status(200).json({ notes });
  } catch (error) {
    console.error("Error retrieving notes:", error);

    // Check if the error is due to unauthorized access
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    // Ensure that the request includes title and content
    const { title, content } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "Title and content are required for creating a note." });
    }

    // Get logged-in user
    const user = await User.findById(req.userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create new note
    const newNote = {
      title,
      content,
    };

    // Add note to the user's notes array
    user.notes.push(newNote);

    // Save the updated user document
    await user.save();

    // Respond with the created note or a success message
    res
      .status(201)
      .json({ message: "Note created successfully", note: newNote });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:noteId", verifyToken, async (req, res) => {
  try {
    // Ensure that the user is valid (was authenticated via verifyToken middleware)
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get note id from parameters
    const noteId = req.params.noteId;

    // Find index of note in user's notes array
    const noteIndex = user.notes.findIndex((n) => n._id == noteId);

    // Handle if note not found
    if (noteIndex === -1) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Remove note from array
    user.notes.splice(noteIndex, 1);

    // Save updated user document
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);

    // Check if the error is due to unauthorized access
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
});
//to update notes
router.put("/:noteId", verifyToken, async (req, res) => {
  try {
    // Ensure that the user is valid (was authenticated via verifyToken middleware)
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get note id from parameters
    const noteId = req.params.noteId;

    // Find index of target note
    const noteIndex = user.notes.findIndex((n) => n._id == noteId);

    // Handle invalid id
    if (noteIndex === -1) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Update note text
    user.notes[noteIndex].title = req.body.title;
    user.notes[noteIndex].content = req.body.content;

    // Save updated document
    await user.save();

    // Respond with the updated note
    res.status(200).json({
      message: "Note updated successfully",
      note: user.notes[noteIndex],
    });
  } catch (error) {
    console.error("Error updating note:", error);

    // Check if the error is due to unauthorized access
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
