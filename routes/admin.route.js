const { Router } = require("express");
const userModel = require("../models/users.model");

const router = Router();

// 🟦 GET ALL USERS (admin)
router.get("/users", async (req, res) => {
  try {
    const users = await userModel.find({}); // returns everything

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.error("Error getting users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟥 DELETE USER BY ID (admin)
router.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await userModel.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted",
      deletedUser,
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
