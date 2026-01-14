const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "REJECTED"], default: "PENDING" },
    amount: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // donor
    report: { // only report now
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },
    paymentIntentId: String,
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("order", orderSchema); 
