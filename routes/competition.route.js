const { Router } = require("express");
const isAuth = require("../middlewares/isauth.middleware");
const Competition = require("../models/competition.model");
const User = require("../models/user.model");

const router = Router();

/**
 * JOIN COMPETITION (manual)
 */
router.post("/join", isAuth, async (req, res) => {
  try {
    const exists = await Competition.findOne({ user: req.userId });
    if (exists) {
      return res.json({ message: "Already joined" });
    }

    await Competition.create({ user: req.userId });

    res.json({ message: "Joined competition" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to join competition" });
  }
});

/**
 * CHECK IF CURRENT USER JOINED
 * GET /competition/me
 */
router.get("/me", isAuth, async (req, res) => {
  try {
    const joined = await Competition.exists({ user: req.userId });
    res.json({ joined: !!joined });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check competition status" });
  }
});

/**
 * LEADERBOARD
 * GET /competition/leaderboard
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const participants = await Competition.find()
      .populate("user", "fullname email")
      .lean();

    const leaderboard = participants.map((entry) => ({
      name: entry.user?.fullname || entry.user?.email || "Anonymous",
      likes: 0, // we’ll connect likes next
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

module.exports = router;
