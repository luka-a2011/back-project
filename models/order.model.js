const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "REJECTED"], default: "PENDING" },
    amount: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }, // donor
    report: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Report",
  required: function () {
    return this.type !== "competition";
  },
},
type: {
  type: String,
  enum: ["donation", "competition"],
  default: "donation",
},
competitionEntry: { type: Boolean, default: false },

    paymentIntentId: String,
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("order", orderSchema); 
