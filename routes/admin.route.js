const { Router } = require("express");
require("../models/users.model");
require("../models/order.model");
require("../models/report.model"); // you can keep this for old reports
require("../models/post.model");   // load post model

const mongoose = require("mongoose");
const userModel = require("../models/users.model");
const orderModel = require("../models/order.model");
const isAuth = require("../middlewares/isauth.middleware");

const router = Router();

/* ================= USERS ================= */
router.get("/users", isAuth, async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  const users = await userModel.find({}, "fullname email role");
  res.json({ users });
});


router.delete("/users/:id", isAuth, async (req, res) => {
  if (req.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  await userModel.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ================= PAYMENTS / DONATIONS ================= */
router.get("/payments", isAuth, async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
const payments = await orderModel
  .find()
  .populate("user", "fullname email") // donor
  .populate({
    path: "report",
    select: "title user", // <-- correct fields
    populate: { path: "user", select: "fullname email" }, // report owner
  })
  .sort({ createdAt: -1 });



    res.json(payments);
  } catch (err) {
    console.error("GET /payments error:", err);
    res.status(500).json({ message: "Server error fetching payments" });
  }
});




module.exports = router;
