const mongoose = require("mongoose");
const { noteSchema } = require("../models/note");

const userSchema = new mongoose.Schema({
  fname: { type: String },
  lname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  notes: [noteSchema],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
