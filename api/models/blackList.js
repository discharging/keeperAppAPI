const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
  token: { type: String },
});

const BlacklistedTokens = mongoose.model("BlacklistedTokens", blacklistSchema);

module.exports = BlacklistedTokens;
