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
/* ================= PAYMENTS / DONATIONS ================= */
router.get("/payments", isAuth, async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const payments = await orderModel
      .find()
      .populate("user", "fullname email") // donor info
      .populate({
        path: "report",
        model: "post", // explicitly tell Mongoose which model to use
        populate: {
          path: "author",
          model: "User", // MUST match your user model name
          select: "fullname email", // fetch fullname + email
        },
      })
      .lean();

    // Format for Dashboard
    const formatted = payments.map((p) => ({
      ...p,
      donorName: p.user?.fullname || "No donor",
      donorEmail: p.user?.email || "N/A",
      reportOwner: p.report?.author?.fullname || "No owner",
      reportOwnerEmail: p.report?.author?.email || p.report?.authorEmail || "N/A",
      reportTitle: p.report?.descriptione || "No title",
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /payments error:", err);
    res.status(500).json({ message: "Server error fetching payments" });
  }
});

module.exports = router;