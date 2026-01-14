const { Router } = require("express");
const userModel = require("../models/users.model");
const orderModel = require("../models/order.model"); // ✅ use correct model
const postModel = require("../models/post.model"); // optional if you still need posts

const router = Router();

// ------------------------
// GET USERS
// ------------------------
router.get("/users", async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const users = await userModel.find({}, "fullname email role");
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

// ------------------------
// DELETE USER
// ------------------------
router.delete("/users/:id", async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    await userModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting user" });
  }
});

// ------------------------
// GET PAYMENTS / DONATIONS
// ------------------------
router.get("/payments", async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const payments = await orderModel
      .find()
      .populate({
        path: "report", // the report associated with the payment
        populate: { path: "author", select: "fullname email" }, // report owner
      })
      .populate("user", "fullname email") // donor
      .lean();

    res.json(payments);
  } catch (err) {
    console.error("GET /payments error:", err);
    res.status(500).json({ message: "Server error fetching payments" });
  }
});

module.exports = router;
