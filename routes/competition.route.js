// const { Router } = require("express");
// const isAuth = require("../middlewares/isauth.middleware");
// const Competition = require("../models/competition.model");

// const router = Router();

// // JOIN COMPETITION
// router.post("/join", isAuth, async (req, res) => {
//   try {
//     const exists = await Competition.findOne({ user: req.userId });
//     if (exists) {
//       return res.json({ message: "Already joined" });
//     }

//     await Competition.create({ user: req.userId });

//     res.json({ message: "Joined competition" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to join competition" });
//   }
// });

// module.exports = router;
