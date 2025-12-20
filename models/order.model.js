const mongoose = require("mongoose");
require("./users.model");
require("./post.model");

const orderSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "SUCCESS", "REJECTED"], default: "PENDING" },
  amount: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }, // donor
  post: { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true }, // link to post
  paymentIntentId: String,
}, { timestamps: true });

module.exports = mongoose.model("order", orderSchema);
