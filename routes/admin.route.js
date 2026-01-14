const { Router } = require("express");
const userModel = require("../models/users.model");
const postModel = require("../models/post.model"); // reports are posts now
const orderModel = require("../models/order.model");

const router = Router();

/* ================= USERS ================= */
router.get("/users", async (req, res) => {
  const role = req.role; // assume isAuth middleware sets req.role
  if (role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const users = await userModel.find({}, "fullname email role");
    res.json({ users });
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const role = req.role;
  if (role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    await userModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /users/:id error:", err);
    res.status(500).json({ message: "Server error deleting user" });
  }
});

/* ================= PAYMENTS / DONATIONS ================= */
router.get("/payments", async (req, res) => {
  const role = req.role;
  if (role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const payments = await orderModel
      .find()
      .populate({
        path: "report",
        model: "post", // <-- point to post.model
        populate: { path: "author", select: "fullname email" }, // get report owner
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
