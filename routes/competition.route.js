const { Router } = require("express");
const isAuth = require("../middlewares/isauth.middleware");
const Competition = require("../models/competition.model");

const router = Router();

/**
 * JOIN COMPETITION (MANUAL)
 */
router.post("/join", isAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const exists = await Competition.findOne({ user: req.userId });
    if (exists) {
      return res.json({ message: "Already joined" });
    }

    const entry = await Competition.create({
      user: req.userId,
      likes: 0,
    });

    res.json({ message: "Joined competition", entry });
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
      .populate({
        path: "user",
        select: "fullname email",
      })
      .sort({ likes: -1 })
      .lean();

    console.log("RAW LEADERBOARD:", leaderboard);

    // 🔥 FILTER BROKEN ENTRIES
    const cleanLeaderboard = leaderboard.filter(
      (entry) => entry.user && entry.user.fullname
    );

    res.json(cleanLeaderboard);
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).json({
      message: "Failed to load leaderboard",
      error: err.message,
    });
  }
});


/**
 * ⚠️ DEV ONLY — CLEAR COMPETITION COLLECTION
 */
router.delete("/__dev/clear", async (req, res) => {
  try {
    await Competition.deleteMany({});
    res.json({ message: "Competition collection cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to clear competition" });
  }
});





module.exports = router;
