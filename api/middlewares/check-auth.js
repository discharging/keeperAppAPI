const jwt = require("jsonwebtoken");
const BlacklistedTokens = require("../models/blackList");
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
    req.token = token;
    next();
  } catch (err) {
    console.error(err);
    res.status(400).send("Invalid token");
  }
}

module.exports = { generateToken, verifyToken };
