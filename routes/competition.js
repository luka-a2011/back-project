const { Router } = require("express");
const isAuth = require("../middlewares/isauth.middleware");
const userModel = require("../models/user.model");

const router = Router();

router.post("/join", isAuth, async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(req.userId, {
      isCompetitionMember: true,
    });

    res.json({ message: "Joined competition successfully" });
  } catch (err) {
    console.error("Join competition error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
