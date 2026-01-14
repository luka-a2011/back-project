const { Router } = require("express");
const userModel = require("../models/users.model");
const postModel = require("../models/post.model");
const cleanupModel = require("../models/cleanup.model"); 
const isAuth = require("../middlewares/isauth.middleware");

const router = Router();

// -------------------- USERS --------------------
router.get("/users", isAuth, async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const users = await userModel.find({}, "fullname email role");
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/users/:id", isAuth, async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    await userModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- PAYMENTS --------------------
router.get("/payments", isAuth, async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const payments = await cleanupModel
      .find()
      .populate({
        path: "report",
        populate: { path: "author", select: "fullname email" },
      })
      .populate("user", "fullname email") // donor
      .lean();

    res.json(payments);
  } catch (err) {
    console.error("GET /payments error:", err);
    res.status(500).json({ message: "Server error fetching payments" });
  }
});

// -------------------- STATS --------------------
router.get("/stats", isAuth, async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

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

module.exports = router;
