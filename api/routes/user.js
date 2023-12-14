const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const router = express.Router();
const { generateToken, verifyToken } = require("../middlewares/check-auth");
const BlacklistedTokens = require("../models/blackList");
const saltRounds = 10;
router.post("/register", async function (req, res) {
  try {
    // Check if the email is unique (assuming User model has a unique constraint on the email field)
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }
    bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
      // Store hash in your password DB.
      const newUser = new User({
        fname: req.body.fName,
        lname: req.body.lName,
        email: req.body.email,
        password: hash, // Assuming the password is received in plaintext
      });

      // Save the new user to the database
      await newUser.save();

      // Generate a JWT token for the new user
      const token = generateToken(newUser);

      // Respond with the generated token
      res.status(201).json({ token }); // 201 Created status for successful resource creation
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate credentials
    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    // Get user from DB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Invalid credentials");
    }
    // Check stored password matches
    bcrypt.compare(password, user.password, function (err, result) {
      if (result) {
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
      } else {
        return res.status(401).send("Invalid credentials");
      }
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Logout route
router.post("/logout", verifyToken, async (req, res) => {
  try {
    // Add to blacklist
    const token = req.token;
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

module.exports = router;
