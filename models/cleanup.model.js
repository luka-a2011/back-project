const mongoose = require("mongoose");

const cleanupSchema = new mongoose.Schema({
  location: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("cleanup", cleanupSchema);
