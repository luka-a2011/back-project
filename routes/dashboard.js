const { Router } = require("express");
const userModel = require("../models/users.model");
const reportModel = require("../models/report.model");
const cleanupModel = require("../models/cleanup.model");

const router = Router();

// Stats endpoint
router.get("/stats", async (req, res) => {
  try {
    const usersCount = await userModel.countDocuments();
    const reportsCount = await reportModel.countDocuments();
    const cleanupsCount = await cleanupModel.countDocuments();

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
