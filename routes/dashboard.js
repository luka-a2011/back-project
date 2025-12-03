const { Router } = require("express");
const userModel = require("../models/users.model");
const postModel = require("../models/post.model"); 

const router = Router();

// Stats endpoint
router.get("/stats", async (req, res) => {
  try {
    const usersCount = await userModel.countDocuments();
    const reportsCount = await postModel.countDocuments();
    const cleanupsCount = 0; 

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
