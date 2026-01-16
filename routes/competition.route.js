const { Router } = require("express");
const isAuth = require("../middlewares/isauth.middleware");
const Competition = require("../models/competition.model");

const router = Router();

/* ===============================
   JOIN COMPETITION
   =============================== */
router.post("/join", isAuth, async (req, res) => {
  try {
    const exists = await Competition.findOne({ user: req.userId });
    if (exists) {
      return res.json({ message: "Already joined" });
    }

    await Competition.create({ user: req.userId });

    res.json({ message: "Joined competition" });
  } catch (err) {
    console.error("Join competition error:", err);
    res.status(500).json({ message: "Failed to join competition" });
  }
});

/* ===============================
   GET LEADERBOARD
   =============================== */
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Competition.find()
      .populate("user", "fullname email")
      .sort({ likes: -1 });

    res.json(leaderboard);
  } catch (err) {
    console.error("Get leaderboard error:", err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

// CHECK IF CURRENT USER IS IN COMPETITION
router.get("/me", isAuth, async (req, res) => {
  try {
    const entry = await Competition.findOne({ user: req.userId });
    res.json({ joined: !!entry });
  } catch (err) {
    res.status(500).json({ message: "Failed to check competition status" });
  }
});


module.exports = router;
