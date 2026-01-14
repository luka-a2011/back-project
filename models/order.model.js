const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "REJECTED"], default: "PENDING" },
    amount: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }, // donor
    report: { // only report now
      type: mongoose.Schema.Types.ObjectId,
      ref: "report",
      required: true,
    },
    paymentIntentId: String,
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("order", orderSchema); 
