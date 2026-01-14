const { Router } = require("express");
const userModel = require("../models/users.model");
const postModel = require("../models/post.model");
const cleanupModel = require("../models/cleanup.model");
const reportModel = require("../models/report.model"); // add report model
const orderModel = require("../models/order.model");
const isAuth = require("../middlewares/isauth.middleware");

const router = Router();

/* ================= STATS (KEEP AS-IS) ================= */
router.get("/stats", async (req, res) => {
  try {
    const usersCount = await userModel.countDocuments();
    const reportsCount = await postModel.countDocuments();
    const cleanupsCount = await postModel.countDocuments({ afterImages: { $exists: true, $ne: [] } });

    res.json({
      users: usersCount,
      reports: reportsCount,
      cleanups: cleanupsCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= REPORTS WITH OWNER ================= */
router.get("/reports", isAuth, async (req, res) => {
  try {
    if (req.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    // Fetch all reports and populate user info (owner)
    const reports = await reportModel
      .find()
      .populate("user", "fullname email") // 🔹 owner info
      .lean();

    res.json({ reports });
  } catch (err) {
    console.error("GET /dashboard/reports error:", err);
    res.status(500).json({ message: "Server error fetching reports" });
  }
});

module.exports = router;
