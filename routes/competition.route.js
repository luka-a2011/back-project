const { Router } = require("express");
const isAuth = require("../middlewares/isauth.middleware");
const Competition = require("../models/competition.model");

const router = Router();

/**
 * JOIN COMPETITION (MANUAL)
 */
router.post("/join", isAuth, async (req, res) => {
  try {
    const exists = await Competition.findOne({ user: req.userId });
    if (exists) {
      return res.json({ message: "Already joined" });
    }

    await Competition.create({ user: req.userId, likes: 0 });
    res.json({ message: "Joined competition" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Join failed" });
  }
});

/**
 * CHECK CURRENT USER STATUS
 */
router.get("/me", isAuth, async (req, res) => {
  try {
    const entry = await Competition.findOne({ user: req.userId });
    res.json({ joined: !!entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check competition status" });
  }
});

/**
 * GET LEADERBOARD
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Competition.find({})
      .populate("user", "fullname email")
      .sort({ likes: -1 })
      .lean();

    res.json(leaderboard);
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).json({
      message: "Failed to load leaderboard",
      error: err.message,
    });
  }
});




module.exports = router;
