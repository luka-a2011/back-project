const { Router } = require("express");
require("../models/users.model");   // make sure user model is loaded
require("../models/order.model");   // make sure order model is loaded
require("../models/report.model");  // ← add this line to load report schema

const userModel = require("../models/users.model");
const orderModel = require("../models/order.model");
const isAuth = require("../middlewares/isauth.middleware");

const router = Router();

/* ================= USERS ================= */
router.get("/users", isAuth, async (req, res) => {
  if (req.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  const users = await userModel.find({}, "fullname email role");
  res.json({ users });
});

router.delete("/users/:id", isAuth, async (req, res) => {
  if (req.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  await userModel.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ================= PAYMENTS / DONATIONS ================= */
router.get("/payments", isAuth, async (req, res) => {
  if (req.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  const payments = await orderModel
    .find()
    // WHO donated
    .populate("user", "fullname email")
    // WHAT report + WHO owns the report
    .populate({
      path: "report",
      select: "title user",
      populate: {
        path: "user",
        select: "fullname email",
      },
    })
    .sort({ createdAt: -1 });

  res.json(payments);
});

module.exports = router;
