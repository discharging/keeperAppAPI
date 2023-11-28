const mongoose = require("mongoose");

// Define Document Schema
const noteSchema = new mongoose.Schema({
  title: { type: String },
  content: { type: String },
});

// Define User Schema
const userSchema = new mongoose.Schema({
  fname: { type: String },
  lname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  notes: [noteSchema], // Embed the document schema as an array
});
const blacklistSchema = new mongoose.Schema({
  token: { type: String },
});

// Create Models
const User = mongoose.model("User", userSchema);
const Note = mongoose.model("Note", noteSchema);
const BlacklistedTokens = mongoose.model("BlacklistedTokens", blacklistSchema);
module.exports = { User, Note, BlacklistedTokens };
