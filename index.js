// Requiring module
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const { User, Note, BlacklistedTokens } = require("./databaseSchemas");
const jwt = require("jsonwebtoken");

function generateToken(user) {
  // Get data from user
  const { _id, fname, lname, email } = user;

  return jwt.sign(
    {
      _id, // instead of user._id
      fname,
      lname,
      email,
    },
    `${process.env.SECRET}`,
    { expiresIn: "1d" }
  );
}
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).send("Unauthorized");
  const token = authHeader.split(" ")[1];
  // Check if token is blacklisted
  const isTokenBlacklisted = await BlacklistedTokens.findOne({ token });

  if (isTokenBlacklisted) {
    return res.status(401).send("Token blacklisted");
  }

  try {
    const decoded = jwt.verify(token, `${process.env.SECRET}`);
    req.userId = decoded._id;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Invalid token");
  }
}
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connecting to database
mongoose.connect(process.env.CONNECTION_STRING_DEV);

const note1 = new Note({
  title: "Boost Productivity",
  content:
    "Maximize efficiency with task prioritization, time-blocking, and strategic breaks. Stay focused and stress-free throughout your workday.",
});

app.get("/", async function (req, res) {
  try {
    res.send("<h1>Backend Working</h1>");
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
});

app.post("/register", async function (req, res) {
  try {
    /* validate incoming form date the the client side
    // Validate incoming data
    if (!req.body.fName || !req.body.lName || !req.body.email || !req.body.password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    */

    /* validate email at the client end
    // Check if the email is in a valid format (you might want to use a more robust email validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    */

    // Check if the email is unique (assuming User model has a unique constraint on the email field)
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const newUser = new User({
      fname: req.body.fName,
      lname: req.body.lName,
      email: req.body.email,
      password: req.body.password, // Assuming the password is received in plaintext
    });

    // Save the new user to the database
    await newUser.save();

    // Generate a JWT token for the new user
    const token = generateToken(newUser);

    // Respond with the generated token
    res.status(201).json({ token }); // 201 Created status for successful resource creation
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate credentials
    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    // Get user from DB
    const user = await User.findOne({ email });

    // Check stored password matches
    if (!user || password !== user.password) {
      return res.status(401).send("Invalid credentials");
    }

    // Token on successful login
    const token = generateToken(user);
    const newUser = {
      _id: user._id,
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      notes: user.notes,
      __v: user.__v,
    };

    res.status(200).json({ token, newUser });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Logout route
app.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    // Validate token
    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET);

    // Add to blacklist
    await BlacklistedTokens.create({ token });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    // Check if the error is due to an invalid token
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/notes", verifyToken, async (req, res) => {
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

app.post("/notes", verifyToken, async (req, res) => {
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

app.delete("/notes/:noteId", verifyToken, async (req, res) => {
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
app.put("/notes/:noteId", verifyToken, async (req, res) => {
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

app.listen(process.env.PORT, function () {
  console.log(`Server started on port ${process.env.PORT}`);
});
